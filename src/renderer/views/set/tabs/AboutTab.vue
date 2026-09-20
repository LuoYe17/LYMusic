<template>
  <div
    class="about-page flex flex-col items-center justify-center text-center px-8 py-12 min-h-[70vh]"
  >
    <img :src="appIcon" alt="LYMusic" class="about-logo" />
    <h1 class="about-title">LYMusic</h1>
    <p class="about-ver">v{{ currentVersion }}</p>

    <p class="about-desc">一款简洁的桌面音乐播放器。支持汽水音乐在线搜播，开源免费，请支持正版。</p>

    <a
      class="about-support"
      href="https://music.douyin.com/"
      target="_blank"
      rel="noopener noreferrer"
      @click.prevent="openQishui"
    >
      <img :src="qishuiIcon" alt="汽水音乐" class="about-support-icon" />
      <span>汽水音乐 · 购买会员</span>
      <i class="ri-external-link-line opacity-70" />
    </a>

    <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
      <ui-button v-if="isElectron" :disabled="checking" @click="checkForUpdates(true)">
        <i v-if="checking" class="ri-loader-4-line animate-spin" />
        {{ checking ? t('settings.about.checking') : t('settings.about.checkUpdate') }}
      </ui-button>
      <ui-button v-if="hasAppUpdate" @click="openReleasePage">
        {{ t('settings.about.gotoUpdate') }} {{ latestVersion }}
      </ui-button>
      <ui-button v-if="showManualUpdate" variant="outline" @click="openManualUpdatePage">
        {{ t('settings.about.manualUpdate') }}
      </ui-button>
    </div>

    <div class="about-meta space-y-3">
      <p>
        {{ t('settings.about.author') }}
        <button type="button" class="text-primary hover:underline ml-1" @click="openAuthor">
          落叶 (@LuoYe17)
        </button>
      </p>
      <p class="flex items-center justify-center gap-4">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 hover:text-primary"
          @click="openAuthor"
        >
          <i class="ri-github-line text-base" /> GitHub
        </button>
        <span class="opacity-40">·</span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 hover:text-primary"
          @click="openReleases"
        >
          <i class="ri-download-cloud-line text-base" /> Releases
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import appIcon from '@/assets/icon.png';
import qishuiIcon from '@/assets/qishui-icon.png';
import { Button as UiButton } from '@/components/ui/button';
import { useSettingsStore } from '@/store/modules/settings';
import { isElectron } from '@/utils';
import config from '../../../../../package.json';
import {
  APP_UPDATE_RELEASE_URL,
  APP_UPDATE_STATUS,
  hasAvailableAppUpdate
} from '../../../../shared/appUpdate';
import { SETTINGS_DATA_KEY, SETTINGS_MESSAGE_KEY } from '../keys';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const setData = inject(SETTINGS_DATA_KEY)!;
const message = inject(SETTINGS_MESSAGE_KEY)!;

const checking = ref(false);

const appUpdateState = computed(() => settingsStore.appUpdateState);
const hasAppUpdate = computed(() => hasAvailableAppUpdate(appUpdateState.value));
const currentVersion = computed(() => appUpdateState.value.currentVersion || config.version);
const latestVersion = computed(() => appUpdateState.value.availableVersion ?? '');
/** 网页预览版没有自动更新，只给官网入口；桌面端在检查失败时同样给 */
const showManualUpdate = computed(
  () => !isElectron || appUpdateState.value.status === APP_UPDATE_STATUS.error
);

const QISHUI_VIP_URL = 'https://music.douyin.com/';

const openQishui = () => {
  window.open(QISHUI_VIP_URL, '_blank');
};

const checkForUpdates = async (isClick = false) => {
  checking.value = true;
  try {
    const result = await window.api.checkAppUpdate(isClick);
    settingsStore.setAppUpdateState(result);

    if (hasAvailableAppUpdate(result)) {
      if (isClick) settingsStore.setShowUpdateModal(true);
    } else if (result.status === APP_UPDATE_STATUS.notAvailable && isClick) {
      message.success(t('settings.about.latest'));
    } else if (result.status === APP_UPDATE_STATUS.error && isClick) {
      message.error(result.errorMessage || t('settings.about.messages.checkError'));
    }
  } catch (error) {
    console.error('检查更新失败:', error);
    if (isClick) {
      message.error(t('settings.about.messages.checkError'));
    }
  } finally {
    checking.value = false;
  }
};

const openReleasePage = () => {
  if (isElectron) {
    settingsStore.setShowUpdateModal(true);
    return;
  }
  window.open(APP_UPDATE_RELEASE_URL);
};

const openManualUpdatePage = async () => {
  if (isElectron) {
    await window.api.openAppUpdatePage();
    return;
  }
  window.open(APP_UPDATE_RELEASE_URL);
};

const openAuthor = () => {
  window.open(setData.value.authorUrl || 'https://github.com/LuoYe17');
};

const openReleases = () => {
  window.open(APP_UPDATE_RELEASE_URL);
};

defineExpose({ checkForUpdates });
</script>

<style scoped>
.about-logo {
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 1.75rem;
  object-fit: cover;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
  margin-bottom: 1.25rem;
}

.about-title {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 0.35rem;
}

.about-ver {
  font-size: 1rem;
  color: var(--muted-foreground, #6b7280);
  margin-bottom: 1.5rem;
}

.about-desc {
  max-width: 36rem;
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--muted-foreground, #6b7280);
  margin-bottom: 1.25rem;
}

.about-support {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color, #22c55e);
  margin-bottom: 2rem;
  text-decoration: none;
  transition: opacity 0.15s ease;
}
.about-support:hover {
  opacity: 0.85;
}

.about-support-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  object-fit: cover;
}

.about-meta {
  font-size: 0.95rem;
  color: var(--muted-foreground, #6b7280);
}
</style>
