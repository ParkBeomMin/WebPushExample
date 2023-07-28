<template>
    <div>
        <button @click="requestPermission">{{ buttonText }}</button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, getCurrentInstance, ref, nextTick } from 'vue';

const instance = getCurrentInstance();
const vapidKey = ref('');
const buttonText = ref('');

onMounted(async () => {
    if (blockBrowser()) {
        return;
    }
    const ds = await (instance?.proxy as any).$axios.get('/api/webPush');
    vapidKey.value = ds.data.vapidKey;
    // Service Worker 등록 코드
    if ('serviceWorker' in navigator) {
        const workerFile = '/service-worker.js';
        try {
            const registration = await navigator.serviceWorker.register(workerFile);
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    buttonText.value = '구독 해지하기';
                } else {
                    buttonText.value = '구독하기';
                }
            }
        } catch (e) {
            console.error(e.message);
        }
    } else {
        console.error('Service Worker in navigator error');
    }
});

const requestPermission = async () => {
    if (blockBrowser()) {
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            // 이미 구독이 되어있다면 해지하기
            await (instance?.proxy as any).$axios.post(`/api/webPush/delToken`, subscription);
            buttonText.value = '구독하기';
            subscription.unsubscribe();
        } else {
            // 구독이 되어있지 않으면 구독하기
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey.value,
            });
            console.log('subscription => ', subscription.toJSON());
            await (instance?.proxy as any).$axios.post('/api/webPush', subscription);
            buttonText.value = '구독 해지하기';
        }
    } catch (e) {
        console.error(e.message);
    }
};

const blockBrowser = () => {
    let isBlock = false;
    let blockMessage = '';
    if (navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Version/') !== -1) {
        const version = navigator.userAgent.split('Version/')[1].split(' ')[0];
        isBlock = parseFloat(version) < 16.4;
        blockMessage = '사파리 브러우저는 16.4 버전 이상에서만 동작합니다.';
    }
    if (navigator.userAgent.indexOf('KAKAOTALK') > -1 || navigator.userAgent.indexOf('NAVER') > -1) {
        blockMessage = '해당 브러우저에서는 기능이 동작하지 않습니다. 기본 브라우저를 사용해주세요.';
        isBlock = true;
    }

    if (isBlock) {
        alert(blockMessage);
    }

    return isBlock;
};
</script>

<style scope>
button {
    margin-top: 16px;
    margin-bottom: 16px;
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 16px;
    font-weight: bold;
}
</style>
