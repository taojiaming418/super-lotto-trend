<template>
  <div class="donate-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">打赏支持</h1>
      <p class="page-subtitle">如果这个大乐透走势分析工具对你有帮助，可以扫码支持后续维护</p>
    </div>

    <!-- 两栏布局 -->
    <div class="donate-columns">
      <!-- 支付宝 -->
      <div class="donate-card alipay-card">
        <div class="donate-card-header">
          <div class="donate-icon-wrapper alipay-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 12h10M7 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="donate-card-title">支付宝</h2>
        </div>
        <div class="qr-placeholder alipay-qr">
          <div class="qr-inner">
            <div class="qr-icon">
              <svg viewBox="0 0 24 24" width="60" height="60" fill="none">
                <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <rect x="15" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <rect x="2" y="15" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <rect x="13" y="13" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5 5h2v2H5zM5 17h3v3H5zM17 5h3v2h-3zM17 15h2v2h-2z" fill="currentColor"/>
              </svg>
            </div>
            <p class="qr-placeholder-text">扫码打赏</p>
          </div>
        </div>
        <p class="donate-hint">使用支付宝扫描上方二维码</p>
      </div>

      <!-- 微信 -->
      <div class="donate-card wechat-card">
        <div class="donate-card-header">
          <div class="donate-icon-wrapper wechat-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none">
              <path d="M8 9a1 1 0 100-2 1 1 0 000 2zM16 9a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M12 3c-4.97 0-9 3.58-9 8 0 2.36 1.12 4.48 2.89 5.95L5 19l2.56-1.28c.77.28 1.59.45 2.44.52" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 19c2.5 0 4.5-1.5 4.5-3.5S16.5 12 14 12s-4.5 1.5-4.5 3.5S11.5 19 14 19z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M17 16.5l2 1-.5-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="donate-card-title">微信</h2>
        </div>
        <div class="qr-placeholder wechat-qr">
          <div class="qr-inner">
            <div class="qr-icon">
              <svg viewBox="0 0 24 24" width="60" height="60" fill="none">
                <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <rect x="15" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <rect x="2" y="15" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <rect x="13" y="13" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5 5h2v2H5zM5 17h3v3H5zM17 5h3v2h-3zM17 15h2v2h-2z" fill="currentColor"/>
              </svg>
            </div>
            <p class="qr-placeholder-text">扫码打赏</p>
          </div>
        </div>
        <p class="donate-hint">使用微信扫描上方二维码</p>
      </div>
    </div>

    <!-- 提醒信息 -->
    <div class="donate-note card">
      <div class="note-icon">💡</div>
      <div class="note-text">
        <p>打赏是完全自愿的。您的支持将用于服务器维护、数据更新和功能开发。</p>
        <p>如在使用过程中遇到问题或有建议，欢迎通过反馈渠道联系我。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Donate page - static content only
</script>

<style scoped>
.donate-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
  line-height: 1.3;
}

.page-subtitle {
  font-size: 14px;
  color: #888;
  line-height: 1.6;
}

/* 两栏布局 */
.donate-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.donate-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #f0f0f0;
}

.donate-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.alipay-card {
  border-top: 4px solid #1677ff;
}

.wechat-card {
  border-top: 4px solid #07c160;
}

.donate-card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.donate-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alipay-icon {
  background: #e6f4ff;
  color: #1677ff;
}

.wechat-icon {
  background: #e8f8ee;
  color: #07c160;
}

.donate-card-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

/* QR码占位 */
.qr-placeholder {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alipay-qr {
  background: linear-gradient(135deg, #f0f5ff, #e6f4ff);
  border: 2px dashed #91caff;
}

.wechat-qr {
  background: linear-gradient(135deg, #f0faf0, #e8f8ee);
  border: 2px dashed #95de64;
}

.qr-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-icon {
  opacity: 0.3;
}

.alipay-qr .qr-icon { color: #1677ff; opacity: 0.5; }
.wechat-qr .qr-icon { color: #07c160; opacity: 0.5; }

.qr-placeholder-text {
  font-size: 14px;
  color: #888;
  font-weight: 500;
}

.donate-hint {
  font-size: 13px;
  color: #999;
}

/* 提醒信息 */
.donate-note {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.note-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.note-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.note-text p {
  margin-bottom: 4px;
}

.note-text p:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .donate-columns {
    grid-template-columns: 1fr;
  }
  .qr-placeholder {
    width: 160px;
    height: 160px;
  }
}

@media (max-width: 480px) {
  .donate-page {
    padding: 0 6px;
  }
  .page-header {
    flex-direction: column;
  }
  .page-title {
    font-size: 22px;
  }
  .donate-card {
    padding: 20px 16px;
  }
  .donate-card-title {
    font-size: 18px;
  }
  .donate-card-header {
    margin-bottom: 16px;
  }
  .qr-placeholder {
    width: 140px;
    height: 140px;
  }
  .donate-note {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .note-text {
    font-size: 13px;
  }
}
</style>
