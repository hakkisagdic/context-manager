# Requirements Document

## Introduction

Context Manager, AI destekli geliştirme için tasarlanmış kapsamlı bir kod analiz platformudur. Bu proje, 18+ programlama dilini destekleyen, method-seviyesi filtreleme, token optimizasyonu, Git entegrasyonu, REST API, watch mode ve plugin mimarisi gibi gelişmiş özelliklere sahiptir. Bu doküman, projenin tüm özelliklerinin doğruluğunu kontrol edecek, mevcut testleri analiz edecek ve eksik/hatalı testleri belirleyecek kapsamlı bir test validasyon sistemi için gereksinimleri tanımlar.

## Glossary

- **Context Manager**: AI geliştirme için kod analiz platformu
- **Token**: LLM (Large Language Model) tarafından işlenen metin birimi
- **Method-Level Analysis**: Fonksiyon/method seviyesinde kod analizi
- **TOON Format**: Token optimizasyonu için özel format (%40-50 azaltma)
- **GitIngest Format**: LLM tüketimi için tek dosya digest formatı
- **Preset**: Önceden yapılandırılmış analiz profili
- **Token Budget Fitter**: Token limitine göre akıllı dosya seçimi
- **Rule Tracer**: Filtre kararlarını izleyen debug aracı
- **Plugin System**: Modüler, genişletilebilir dil ve exporter sistemi
- **Watch Mode**: Gerçek zamanlı dosya izleme ve otomatik analiz
- **REST API**: HTTP üzerinden programatik erişim
- **Property-Based Test**: Rastgele girdilerle evrensel özellikleri test etme
- **Unit Test**: Belirli örnekleri ve edge case'leri test etme
- **Integration Test**: Bileşenler arası etkileşimi test etme
- **Coverage**: Test kapsamı yüzdesi

## Requirements

### Requirement 1: Core Token Analysis Validation

**User Story:** Bir geliştirici olarak, token hesaplama ve analiz özelliklerinin doğru çalıştığından emin olmak istiyorum, böylece LLM context optimizasyonu güvenilir olur.

#### Acceptance Criteria

1. WHEN token calculator bir dosyayı analiz eder THEN the system SHALL tiktoken kullanarak doğru token sayısını hesaplamalıdır
2. WHEN tiktoken mevcut değilse THEN the system SHALL %95 doğrulukla tahmin yapmalıdır
3. WHEN birden fazla dosya analiz edilir THEN the system SHALL toplam token sayısını doğru hesaplamalıdır
4. WHEN dosya türüne göre gruplama yapılır THEN the system SHALL her dosya türü için doğru istatistikleri üretmelidir
5. WHEN en büyük dosyalar listelenir THEN the system SHALL token sayısına göre doğru sıralama yapmalıdır

### Requirement 2: Method-Level Analysis Validation

**User Story:** Bir geliştirici olarak, method-seviyesi analiz özelliklerinin tüm desteklenen dillerde doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN JavaScript/TypeScript dosyası analiz edilir THEN the system SHALL tüm fonksiyonları ve methodları doğru çıkarmalıdır
2. WHEN Rust dosyası analiz edilir THEN the system SHALL tüm fn tanımlarını doğru çıkarmalıdır
3. WHEN C# dosyası analiz edilir THEN the system SHALL tüm method tanımlarını doğru çıkarmalıdır
4. WHEN Go dosyası analiz edilir THEN the system SHALL tüm func tanımlarını doğru çıkarmalıdır
5. WHEN Java dosyası analiz edilir THEN the system SHALL tüm method tanımlarını doğru çıkarmalıdır
6. WHEN SQL dosyası analiz edilir THEN the system SHALL tüm stored procedure ve function tanımlarını çıkarmalıdır
7. WHEN method filtreleme uygulanır THEN the system SHALL .methodinclude ve .methodignore kurallarına uymalıdır

### Requirement 3: File Filtering System Validation

**User Story:** Bir geliştirici olarak, dosya filtreleme sisteminin (include/exclude modes) doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN sadece .contextignore mevcut THEN the system SHALL EXCLUDE modunda çalışmalıdır
2. WHEN .contextinclude mevcut THEN the system SHALL INCLUDE modunda çalışmalı ve .contextignore'u görmezden gelmelidir
3. WHEN .gitignore kuralları var THEN the system SHALL her iki modda da .gitignore kurallarına uymalıdır
4. WHEN wildcard pattern kullanılır THEN the system SHALL doğru dosyaları eşleştirmelidir
5. WHEN negation pattern kullanılır THEN the system SHALL doğru dosyaları hariç tutmalıdır
6. WHEN nested directory pattern kullanılır THEN the system SHALL recursive eşleştirme yapmalıdır

### Requirement 4: TOON Format Validation

**User Story:** Bir geliştirici olarak, TOON format encoding/decoding işlemlerinin doğru çalıştığından ve %40-50 token azaltması sağladığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN TOON formatter bir context encode eder THEN the system SHALL geçerli TOON formatı üretmelidir
2. WHEN TOON decoder bir TOON dosyası okur THEN the system SHALL orijinal yapıyı geri yüklemelidir
3. WHEN TOON format kullanılır THEN the system SHALL en az %40 token azaltması sağlamalıdır
4. WHEN TOON validator bir dosyayı kontrol eder THEN the system SHALL format hatalarını tespit etmelidir
5. WHEN TOON stream encoder kullanılır THEN the system SHALL büyük dosyaları parça parça işlemelidir
6. WHEN TOON diff hesaplanır THEN the system SHALL iki version arasındaki farkları doğru bulmalıdır

### Requirement 5: GitIngest Format Validation

**User Story:** Bir geliştirici olarak, GitIngest format üretiminin doğru çalıştığından ve LLM tüketimi için uygun olduğundan emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN GitIngest formatter çalıştırılır THEN the system SHALL tek bir digest.txt dosyası üretmelidir
2. WHEN digest dosyası oluşturulur THEN the system SHALL proje özetini içermelidir
3. WHEN digest dosyası oluşturulur THEN the system SHALL directory tree yapısını içermelidir
4. WHEN digest dosyası oluşturulur THEN the system SHALL tüm dosya içeriklerini ayırıcılarla içermelidir
5. WHEN digest JSON report'tan oluşturulur THEN the system SHALL yeniden tarama yapmadan hızlı üretim yapmalıdır

### Requirement 6: Preset System Validation

**User Story:** Bir geliştirici olarak, preset sisteminin doğru çalıştığından ve tüm preset'lerin geçerli olduğundan emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN preset listesi istenir THEN the system SHALL tüm mevcut preset'leri listelemelidir
2. WHEN bir preset yüklenir THEN the system SHALL doğru konfigürasyonu uygulamalıdır
3. WHEN geçersiz preset istenir THEN the system SHALL anlamlı hata mesajı vermelidir
4. WHEN preset bilgisi istenir THEN the system SHALL preset detaylarını göstermelidir
5. WHEN preset kullanılır THEN the system SHALL preset'te tanımlı tüm ayarları uygulamalıdır

### Requirement 7: Token Budget Fitter Validation

**User Story:** Bir geliştirici olarak, token budget fitter'ın doğru çalıştığından ve akıllı dosya seçimi yaptığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN token budget belirtilir THEN the system SHALL belirtilen limite uymalıdır
2. WHEN auto strategy seçilir THEN the system SHALL en uygun stratejiyi otomatik seçmelidir
3. WHEN shrink-docs strategy kullanılır THEN the system SHALL önce dokümantasyon dosyalarını çıkarmalıdır
4. WHEN balanced strategy kullanılır THEN the system SHALL token/dosya verimliliğini optimize etmelidir
5. WHEN methods-only strategy kullanılır THEN the system SHALL sadece method'ları çıkarmalıdır
6. WHEN top-n strategy kullanılır THEN the system SHALL en önemli dosyaları seçmelidir
7. WHEN entry point'ler var THEN the system SHALL entry point'leri koruma önceliği vermelidir

### Requirement 8: Git Integration Validation

**User Story:** Bir geliştirici olarak, Git entegrasyonunun doğru çalıştığından ve değişen dosyaları doğru tespit ettiğinden emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN changed-only flag kullanılır THEN the system SHALL sadece uncommitted değişiklikleri analiz etmelidir
2. WHEN changed-since kullanılır THEN the system SHALL belirtilen commit/branch'ten sonraki değişiklikleri bulmalıdır
3. WHEN with-authors flag kullanılır THEN the system SHALL yazar bilgilerini içermelidir
4. WHEN diff analyzer çalışır THEN the system SHALL dosya değişikliklerini doğru hesaplamalıdır
5. WHEN blame tracker çalışır THEN the system SHALL satır bazında yazar bilgilerini bulmalıdır

### Requirement 9: Watch Mode Validation

**User Story:** Bir geliştirici olarak, watch mode'un doğru çalıştığından ve dosya değişikliklerini gerçek zamanlı izlediğinden emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN watch mode başlatılır THEN the system SHALL dosya değişikliklerini izlemeye başlamalıdır
2. WHEN bir dosya değişir THEN the system SHALL otomatik analiz yapmalıdır
3. WHEN debounce ayarlanır THEN the system SHALL belirtilen süre kadar beklemelidir
4. WHEN incremental analyzer çalışır THEN the system SHALL sadece değişen dosyaları yeniden analiz etmelidir
5. WHEN watch mode durdurulur THEN the system SHALL tüm izleyicileri temizlemelidir

### Requirement 10: REST API Validation

**User Story:** Bir geliştirici olarak, REST API'nin doğru çalıştığından ve tüm endpoint'lerin beklendiği gibi yanıt verdiğinden emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN GET /api/v1/analyze çağrılır THEN the system SHALL tam proje analizini döndürmelidir
2. WHEN GET /api/v1/methods çağrılır THEN the system SHALL dosyadan method'ları çıkarmalıdır
3. WHEN GET /api/v1/stats çağrılır THEN the system SHALL proje istatistiklerini döndürmelidir
4. WHEN GET /api/v1/diff çağrılır THEN the system SHALL Git diff analizini döndürmelidir
5. WHEN POST /api/v1/context çağrılır THEN the system SHALL akıllı context üretmelidir
6. WHEN GET /api/v1/docs çağrılır THEN the system SHALL API dokümantasyonunu döndürmelidir
7. WHEN auth-token belirtilir THEN the system SHALL token doğrulaması yapmalıdır

### Requirement 11: Plugin System Validation

**User Story:** Bir geliştirici olarak, plugin sisteminin doğru çalıştığından ve yeni dil/exporter eklemenin kolay olduğundan emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN yeni bir language plugin kaydedilir THEN the system SHALL plugin'i kullanılabilir hale getirmelidir
2. WHEN yeni bir exporter plugin kaydedilir THEN the system SHALL plugin'i kullanılabilir hale getirmelidir
3. WHEN plugin listesi istenir THEN the system SHALL tüm kayıtlı plugin'leri listelemelidir
4. WHEN plugin çalıştırılır THEN the system SHALL plugin'in execute methodunu çağırmalıdır
5. WHEN plugin hata verirse THEN the system SHALL hatayı yakalayıp anlamlı mesaj vermelidir

### Requirement 12: UI Components Validation

**User Story:** Bir geliştirici olarak, UI bileşenlerinin (Wizard, Dashboard, SelectInput) doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN wizard başlatılır THEN the system SHALL kullanıcıya seçenekleri sunmalıdır
2. WHEN dashboard gösterilir THEN the system SHALL analiz sonuçlarını görselleştirmelidir
3. WHEN select input kullanılır THEN the system SHALL kullanıcı seçimini doğru almalıdır
4. WHEN progress bar gösterilir THEN the system SHALL ilerlemeyi doğru yansıtmalıdır
5. WHEN UI bileşeni render edilir THEN the system SHALL terminal'de doğru görüntülemelidir

### Requirement 13: LLM Detection and Optimization Validation

**User Story:** Bir geliştirici olarak, LLM detection ve optimization özelliklerinin doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN environment variable'dan LLM tespit edilir THEN the system SHALL doğru modeli tanımalıdır
2. WHEN target-model belirtilir THEN the system SHALL model için optimizasyon yapmalıdır
3. WHEN context window analizi yapılır THEN the system SHALL doğru token limiti kullanmalıdır
4. WHEN list-llms çağrılır THEN the system SHALL desteklenen tüm modelleri listelemelidir
5. WHEN custom LLM profili yüklenir THEN the system SHALL custom ayarları uygulamalıdır

### Requirement 14: Export and Clipboard Validation

**User Story:** Bir geliştirici olarak, export ve clipboard özelliklerinin tüm platformlarda doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN context-export kullanılır THEN the system SHALL llm-context.json dosyası oluşturmalıdır
2. WHEN context-clipboard kullanılır THEN the system SHALL context'i clipboard'a kopyalamalıdır
3. WHEN save-report kullanılır THEN the system SHALL detaylı JSON report oluşturmalıdır
4. WHEN compact format seçilir THEN the system SHALL ~2.3k karakter üretmelidir
5. WHEN detailed format seçilir THEN the system SHALL ~8.6k karakter üretmelidir
6. WHEN clipboard işlemi başarısız olur THEN the system SHALL fallback mekanizması kullanmalıdır

### Requirement 15: Error Handling and Validation

**User Story:** Bir geliştirici olarak, hata yönetiminin sağlam olduğundan ve tüm edge case'lerin ele alındığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN geçersiz dosya yolu verilir THEN the system SHALL anlamlı hata mesajı vermelidir
2. WHEN dosya okuma hatası oluşur THEN the system SHALL hatayı yakalayıp devam etmelidir
3. WHEN geçersiz pattern kullanılır THEN the system SHALL pattern hatasını raporlamalıdır
4. WHEN token hesaplama başarısız olur THEN the system SHALL fallback mekanizması kullanmalıdır
5. WHEN API endpoint'e geçersiz istek gelir THEN the system SHALL 400 Bad Request döndürmelidir
6. WHEN beklenmeyen hata oluşur THEN the system SHALL stack trace ile log yapmalıdır

### Requirement 16: Performance and Caching Validation

**User Story:** Bir geliştirici olarak, performans optimizasyonlarının ve caching mekanizmasının doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN cache manager kullanılır THEN the system SHALL sonuçları cache'lemelidir
2. WHEN cache'lenmiş sonuç var THEN the system SHALL yeniden hesaplama yapmadan cache'den dönmelidir
3. WHEN cache invalidate edilir THEN the system SHALL eski sonuçları temizlemelidir
4. WHEN parallel processing kullanılır THEN the system SHALL birden fazla dosyayı eşzamanlı işlemelidir
5. WHEN büyük dosya işlenir THEN the system SHALL memory efficient şekilde işlemelidir

### Requirement 17: Cross-Platform Compatibility Validation

**User Story:** Bir geliştirici olarak, uygulamanın tüm platformlarda (Windows, macOS, Linux) doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN Windows'ta çalıştırılır THEN the system SHALL Windows path separator'ları kullanmalıdır
2. WHEN macOS'ta çalıştırılır THEN the system SHALL macOS clipboard komutlarını kullanmalıdır
3. WHEN Linux'ta çalıştırılır THEN the system SHALL Linux clipboard komutlarını kullanmalıdır
4. WHEN path işlemleri yapılır THEN the system SHALL platform-agnostic path utilities kullanmalıdır
5. WHEN line ending'ler farklı THEN the system SHALL her iki formatı da doğru işlemelidir

### Requirement 18: Configuration and Updater Validation

**User Story:** Bir geliştirici olarak, konfigürasyon yönetimi ve updater özelliklerinin doğru çalıştığından emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN config dosyası okunur THEN the system SHALL geçerli konfigürasyonu yüklemelidir
2. WHEN config dosyası yazılır THEN the system SHALL değişiklikleri kaydetmelidir
3. WHEN update check yapılır THEN the system SHALL yeni versiyonu kontrol etmelidir
4. WHEN update install edilir THEN the system SHALL yeni versiyonu indirip kurmalıdır
5. WHEN rollback yapılır THEN the system SHALL önceki versiyona dönmelidir

### Requirement 19: SQL Dialect Support Validation

**User Story:** Bir geliştirici olarak, tüm SQL dialect'lerinin (10+ dialect) doğru desteklendiğinden emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN T-SQL dosyası analiz edilir THEN the system SHALL SQL Server syntax'ını tanımalıdır
2. WHEN PL/pgSQL dosyası analiz edilir THEN the system SHALL PostgreSQL syntax'ını tanımalıdır
3. WHEN MySQL dosyası analiz edilir THEN the system SHALL MySQL syntax'ını tanımalıdır
4. WHEN PL/SQL dosyası analiz edilir THEN the system SHALL Oracle syntax'ını tanımalıdır
5. WHEN SQLite dosyası analiz edilir THEN the system SHALL SQLite syntax'ını tanımalıdır
6. WHEN Snowflake SQL analiz edilir THEN the system SHALL Snowflake syntax'ını tanımalıdır
7. WHEN DB2 SQL analiz edilir THEN the system SHALL DB2 syntax'ını tanımalıdır
8. WHEN Redshift SQL analiz edilir THEN the system SHALL Redshift syntax'ını tanımalıdır
9. WHEN BigQuery SQL analiz edilir THEN the system SHALL BigQuery syntax'ını tanımalıdır

### Requirement 20: Markup Language Support Validation

**User Story:** Bir geliştirici olarak, markup dillerinin (HTML, Markdown, XML) doğru desteklendiğinden emin olmak istiyorum.

#### Acceptance Criteria

1. WHEN HTML dosyası analiz edilir THEN the system SHALL HTML tag'lerini ve yapısını tanımalıdır
2. WHEN Markdown dosyası analiz edilir THEN the system SHALL Markdown syntax'ını tanımalıdır
3. WHEN XML dosyası analiz edilir THEN the system SHALL XML yapısını tanımalıdır
4. WHEN markup dosyası token hesaplanır THEN the system SHALL doğru token sayısını vermelidir
5. WHEN markup dosyası filtrelenir THEN the system SHALL filtre kurallarına uymalıdır
