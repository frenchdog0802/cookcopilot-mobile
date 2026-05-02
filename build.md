# iOS + Windows + Expo（NitroModules）開發 SOP

## 適用情境
- 使用 **Windows 電腦**
- 使用 **iPhone 實機測試**
- 專案基於 **Expo**
- 使用需要原生模組的套件（NitroModules / OnrampSdk / Payment SDK）
- ❌ 無法使用 Expo Go



## 核心觀念
> **Expo Go 不支援原生模組（NitroModules）**  
> 若專案包含原生套件，必須使用 **Expo Dev Client + EAS Build**



## 一次性設定（只需做一次）

### 1. 安裝 EAS CLI（Windows）
```bash
npm install -g eas-cli
eas --version
```
2. 登入 Expo / EAS
```bash
eas login
```
3. 產生 iOS / Android 原生資料夾

```bash
npx expo prebuild
```

ios/
android/

4. 建立 iOS Development Build

5. 在 iPhone 安裝 App

# Build 完成後，取得安裝連結

# 使用 Safari 開啟連結

# 點選 Install

# 前往
# 設定 → 一般 → VPN 與裝置管理

# 信任開發者

# 此 App 為專屬 Expo Dev Client（非 Expo Go） (need pay money)
```bash
eas build -p ios --profile development
```
6. 啟動 Dev Client（Windows）
```bash
npx expo start --dev-client
```