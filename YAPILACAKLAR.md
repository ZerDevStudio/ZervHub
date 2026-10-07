# ZenDev — SaaS Yol Haritası & Backlog (YAPILACAKLAR.md)

> **BAĞLAYICI DİREKTİF:** Bu yol haritası, `.agents/rules/zendev-saas-directive.md` (ZenDev SaaS Dönüşüm Direktifi) ve `.agents/skills/zendev-feature-gatekeeper/` çerçevesine göre yapılandırılmıştır.
> Ürünün çekirdek odağı: **API-ağırlıklı geliştiriciler ve yazılım ekipleri için kurumsal B2B/Pro Masaüstü Geliştirici SaaS platformudur.**

---

## 🎯 Öncelikli SaaS Dönüşüm Fazları

### Faz 1 — Modül Temizliği, Güvenlik & Ayrıştırma (Deprecation & Hardening)
*Amaç: SaaS kimliğiyle çelişen, güvenlik yazılımlarında şüphe doğuran ve yüksek OS bakım maliyeti getiren modüllerin çekirdekten tasfiyesi ve şeffaflaştırılması.*

- [x] **Port Killer (Port Watchdog) Tasfiyesi:**
  - İşletim sistemi süreçlerini sonlandırma (`taskkill`, `kill`) ve yerel soket müdahale mekanizmasının çekirdekten çıkarılması.
  - UI ve API rotalarından kaldırılması veya harici, izole bir opsiyonel yardımcıya ayrıştırılması.
- [x] **System Optimizer Tasfiyesi:**
  - DNS önbellek temizliği (`ipconfig /flushdns`) ve `%TEMP%` disk temizleme mantığının çekirdekten tasfiyesi.
- [x] **Sessiz Otonom Güncelleyicinin Şeffaf / Kullanıcı Onaylı Akışa Dönüştürülmesi:**
  - Arka planda `CREATE_NO_WINDOW` ile kullanıcının haberi olmadan çalışan otonom NSIS güncelleme akışının durdurulması.
  - Antivirüs ve EDR (Endpoint Detection and Response) sistemlerinde false-positive malware şüphesi yaratmayacak şeffaf modal akışına geçilmesi.
  - Yeni sürüm bulunduğunda changelog modalı gösterilmesi; indirme ve kurulumun yalnızca **açık kullanıcı onayı** ile başlatılması.
- [x] **Temp Mail Tasfiyesi:**
  - Tek kullanımlık e-posta üreticisinin yasal riskler, abuse ve spam tehditleri nedeniyle SaaS çekirdeğinden kaldırılması.
- [x] **Düşük Diferansiyasyonlu OS Araçlarının Arka Plana Alınması:**
  - `Clipboard Manager` ve basit scratchpad'in ana yol haritası ve pazarlama vitrininden düşürülmesi.

---

### Faz 2 — Table Stakes SaaS Altyapısı (Cloud, Auth, Billing & Licensing)
*Amaç: B2B ve Pro kullanıcıların para ödemeye hazır olduğu kurumsal temel servislerin inşası.*

- [x] **Cloud Sync Motoru (Uçtan Uca Şifreli Bulut Senkronizasyonu):**
  - Geliştirici çalışma alanları, API ortam değişkenleri (`environments`), istek koleksiyonları, regex kuralları ve mock veri şablonlarının cihazlar arası güvenli senkronizasyonu.
  - Yerel-öncelikli (offline-first) çalışan, internet bağlandığında E2EE (Zero-Knowledge AES-256-GCM) ile sunucuya senkronize olan veri mimarisi.
- [x] **Team Auth, Workspaces & RBAC:**
  - Multi-tenant organizasyon ve takım çalışma alanı yönetimi (`TeamAuthContext.tsx`, `TeamMembersModal.tsx`).
  - Takım üyesi davet etme akışları, rol ve izin matrisi (Owner, Admin, Member, Viewer) ve koltuk koruması (`teamRbacEngine.test.ts`).
  - Kurumsal kimlik doğrulama: GitHub OAuth, Google SSO, SAML 2.0 / Okta desteği ve TitleBar takım rozeti entegrasyonu.
- [x] **Monetization, Stripe / Paddle & Faturalandırma:**
  - Free (Bireysel Temel), Pro (Bireysel Güçlü Geliştirici) ve Team (Sınırsız Çalışma Alanı & İş Birliği) fiyatlandırma katmanları.
  - Stripe Checkout ve Müşteri Faturalandırma Portalı entegrasyonu (`BillingModal.tsx`).
  - Uygulama içi lisans anahtarı aktivasyonu, kupon motoru ve faturalandırma yönetimi.
- [x] **Sunucu Taraflı Lisanslama ve Koltuk (Seat) Yönetimi:**
  - Dinamik cihaz/koltuk limitlerinin takibi, lisans koltuğu devri ve anlık serbest bırakma altyapısı (`seatLicenseManager.ts`, `SeatManagementModal.tsx`, `SeatUsageCard.tsx`).
  - 24 saatlik kriptografik lease token ve 7 günlük çevrimdışı kullanım izin süresi (offline grace period) motoru (`seatLicenseEngine.test.ts`).
- [x] **Şeffaf ve Gizlilik Odaklı Telemetri:**
  - Kullanıcı onayına bağlı (opt-in), KVKK/GDPR uyumlu anonimleştirilmiş hata ve çökme raporlama (`telemetryManager.ts`, `TelemetryModal.tsx`, `TelemetrySettingsCard.tsx`).
  - Dosya yollarından kullanıcı adlarını, e-postaları, JWT ve API tokenlarını maskeleyen sıkı PII temizleme motoru ve canlı tanı denetim kaydı (`telemetryEngine.test.ts`).

---

### Faz 3 — Diferansiyasyon & B2B Moat (Workflow Chains, Team Collections, AI Dispatcher)
*Amaç: ZenDev'i web sitelerinden ve ücretsiz rakiplerinden ayıran, düzenli abonelik ödemesini haklı çıkaran rekabet kalkanı.*

- [x] **Workflow Chains (İş Akışı Zincirleri Motoru):**
  - Geliştirici stüdyolarını görsel ve script ile birbirine bağlayan reaktif pipeline çalıştırma motoru (`chainExecutor.ts`, `chainStore.ts`, `WorkflowChains.tsx`).
  - Dinamik değişken interpolasyonu (`{{variables.KEY}}`, `{{step_id.output}}`), dot-path JSON filtreleme ve assertions motoru (`workflowChainsEngine.test.ts`).
  - WebCrypto tabanlı HMAC-SHA256/SHA512 ve SHA-256 dijital imzalama, Base64/Hex/URL veri dönüştürücüler.
  - Hazır kurumsal şablonlar (HMAC-SHA256 Webhook İmzalama & Gönderim, OAuth2 Token Handshake & Korumalı API, Kriptografik Veri Boru Hattı) ve 16/16 birim test onayı (`tests/run_workflow_chains_test.mjs`).
- [x] **Paylaşılabilir Takım Koleksiyonları (Team Collections):**
  - Git-dostu JSON formatında saklanan, versiyon kontrollü (SemVer) ve SHA-256 bütünlük imzalı paylaşımlı takım koleksiyonları (`teamCollectionManager.ts`, `TeamCollectionsContext.tsx`).
  - 4 Çekirdek Geliştirici Stüdyosu için hazır kurumsal şablonlar (`defaultPresets.ts`):
    - *API Koleksiyonu:* Mikroservis REST ve HMAC Webhook uç noktaları (`col_api_gateway`).
    - *Regex Kütüphanesi:* RFC 5322 Email, TCKN ve UUID v4 kuralları (`col_regex_secops`).
    - *Cron Takvimi:* Gece yarısı veritabanı yedeği, saatlik token süpürme ve Cuma raporları (`col_cron_devops`).
    - *Mermaid Mimarileri:* OAuth2 + PKCE protokol akışı ve Olay Tabanlı Webhook Topolojisi (`col_mermaid_arch`).
  - Takım İzinleri (RBAC) Entegrasyonu: Owner/Admin/Member yazma ve içe aktarma yetkisine sahipken Viewer rolü salt okunur kısıtlamasına tabidir.
  - TitleBar takım koleksiyonu durum rozeti (`TeamCollectionsBadge.tsx`), modal arayüzü (`TeamCollectionsModal.tsx`), Komut Paleti eylemi ve 10/10 birim test doğrulaması (`tests/run_team_collections_test.mjs`).
- [x] **AI Destekli Akıllı Ayrıştırıcı (AI Smart Dispatcher):**
  - Panodaki ve arama çubuğundaki veriyi otomatik tanıyan, stüdyolara anlık akıllı yönlendirme ve onarım öneren yerel motor (`SmartDispatcherEngine.ts`, `smartPasteDetector.ts`).
  - *cURL Analizcisi:* cURL komutlarını (`-X`, `-H`, `-d`, URL) anında ayrıştırıp `ApiStudio` hazır istek formatına dönüştürme.
  - *Bozuk JSON Akıllı Onarımı:* Tek tırnakları, tırnaksız nesne anahtarlarını, fazlalık virgülleri ve eksik parantezleri tespit edip otomatik onarım (`canAutoRepair`) önerisi sunma.
  - *JWT Süre Denetimi:* Token yükünü ve başlığını çözümleyip geçmiş zaman damgalı (`exp`) tokenlar için süre aşımı uyarısı üretme ve `JwtStudio`'ya aktarma.
  - *SQL, Stacktrace & Kriptografik Özet:* SQL sorgu tiplerini/tablolarını tanıma, hata yollarından kullanıcı adlarını maskeleyen PII temizliği ve SHA-256/MD5/Base64 çözümleri.
  - Zengin siber arayüz kartları (`SmartPasteCard.tsx`), Komut Paleti entegrasyonu ve 13/13 birim test onayı (`tests/run_smart_dispatcher_test.mjs`).

---

### Faz 4 — Güvenlik, Uyumluluk & Dağıtım Mükemmeliyeti
*Amaç: Kurumsal BT ve güvenlik departmanlarından sıfır engelle onay almak.*

- [x] **Genişletilmiş Kod İmzalama (EV Code Signing & Azure Trusted Signing):**
  - Windows SmartScreen ve macOS Notarization uyarılarını tamamen kaldıran kurumsal sertifikasyon mimarisi (`docs/ENTERPRISE_CODE_SIGNING.md`).
  - Microsoft Azure Trusted Signing (FIPS 140-2 Level 2 Cloud HSM) entegrasyonu, RFC 3161 SHA-256 çift zaman damgası ve CI/CD pipeline otomasyonu.
  - Apple Developer ID Application kod imzalama, Hardened Runtime ve `notarytool` otomatik noter onay mekanizması.
- [x] **EDR & Antivirüs Temizliği (Zero False-Positive Hardening):**
  - Windows Defender, CrowdStrike Falcon, SentinelOne Singularity, Cortex XDR ve Sophos Intercept X kurumsal güvenlik yazılımlarında 0 false-positive skoru (`docs/SECURITY_EDR_COMPLIANCE.md`).
  - Arka planda sessiz otonom güncelleme (`CREATE_NO_WINDOW` / silent `/S`) davranışı kalıcı olarak yasaklandı; şeffaf, sürüm notlu ve kullanıcı onaylı interaktif modal akışı uygulandı.
  - Sistem müdahale araçları (`Port Killer`, `System Optimizer`, `Temp Mail`) çekirdekten tamamen arındırıldı.
  - Rust derleme seviyesinde ASLR, DEP/NX, CFG (Control Flow Guard) ve SafeSEH ikili sertleştirme bayrakları.
  - Kayıt öncesi yerel PII ve gizli anahtar (Private Key, JWT, Luhn-valid Credit Card, API Keys) otomatik maskeleme ve 9/9 test doğrulaması (`tests/run_edr_antivirus_compliance_test.mjs`).
- [x] **Kurumsal Denetim İzi (Tamper-Evident Audit Log & SOC 2 / ISO 27001 Reporter):**
  - SHA-256 blok zinciri tabanlı kriptografik yerel denetim günlüğü (`src/shared/auditIntegrity.ts`).
  - Takım çalışma alanlarında yapılan kritik değişiklikler için otomatik audit kaydı: Takım kimlik doğrulaması (`teamAuthManager.ts`), paylaşılan koleksiyonlar (`teamCollectionManager.ts`), koltuk lisans yönetimi (`seatLicenseManager.ts`) ve E2EE kasa senkronizasyonu (`syncManager.ts`).
  - SOC 2 Type II (CC6.1, CC6.2, CC6.6, CC7.2, CC8.1) ve ISO/IEC 27001:2022 (A.5.15, A.8.15, A.8.24, A.8.7, A.8.8) uyumluluk denetim motoru (`src/renderer/src/lib/auditCompliance/auditReporter.ts`).
  - Tahrifat tespit algoritması, GRC platformları (Vanta, Drata, Secureframe) için JSON ve RFC uyumlu CSV dışa aktarımı ve 12/12 birim test onayı (`tests/run_audit_reporter_test.mjs`, `tests/auditReporter.test.ts`).

---

## 🏛️ Mevcut Durum & Çekirdek Stüdyo Envanteri (v2.5.6)

ZenDev, **Tauri v2 + Rust + React 19** mimarisi üzerinde çalışan, 21 öne çıkan araç ve 20 aktif stüdyo içeren güçlü bir çekirdeğe sahiptir:

### Aktif Çekirdek Geliştirici Stüdyoları
- **JSON Studio:** Formatlama, küçültme, ayrıştırma ve JSON diff.
- **API Studio & cURL Runner:** REST API testi, cURL çalıştırma, gecikme ölçümü.
- **Regex Studio:** Canlı eşleşme, named groups, bayraklar, test bankası.
- **JWT Studio:** Başlık/yük çözümleme, HMAC-SHA256 doğrulama, süre sonu zaman tüneli.
- **Cron Studio:** Görsel cron oluşturucu, Türkçe/İngilizce açıklama, sonraki 10 çalışma zamanı.
- **Mermaid Studio:** Mimari akış, sıralama ve ERD diyagramları (SVG/PNG aktarımı).
- **Encoding Studio:** Base64, Hex, URL Encoding ve Data-URL görselleştirici.
- **Hash Studio:** MD5, SHA-1, SHA-256, SHA-512 kriptografik hash üretici.
- **Universal Decrypter:** Şifreli bağlantı ve algoritma analizi.
- **Password Generator:** Güçlü, özelleştirilebilir şifre üretici.
- **Cyber Fortress:** AES-GCM şifreleme ve güvenli veri koruma.
- **Image Toolkit:** Görsel sıkıştırma, format dönüştürme (WebP), boyutlandırma.
- **PDF Studio:** PDF birleştirme, bölme ve şifreleme.
- **Bulk Organizer:** Toplu dosya yeniden adlandırma ve klasör düzenleme.
- **QR Code Studio:** QR kod üretici ve tersine görsel okuyucu.
- **Color Studio:** HEX/RGB/HSL/CMYK dönüştürücü, WCAG kontrast analizi, CSS gradyan.
- **Fake Data Studio:** Gerçekçi mock veri üretici (TR/EN yerel desteği).
