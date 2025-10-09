# Çıktı Formatları

<cite>
**Bu Dokümanda Referans Verilen Dosyalar**
- [README.md](file://README.md)
- [context-manager.js](file://context-manager.js)
- [bin/cli.js](file://bin/cli.js)
</cite>

## İçindekiler
1. [Giriş](#giriş)
2. [Detaylı JSON Raporu](#detaylı-json-raporu)
3. [LLM Context Formatları](#llm-context-formatları)
4. [Pano Formatı](#pano-formatı)
5. [Kullanım Senaryoları ve Performans](#kullanım-senaryoları-ve-performans)
6. [Parsing Stratejileri](#parsing-stratejileri)

## Giriş

context-manager aracı, AI destekli geliştirme iş akışlarında farklı kullanım senaryoları için üç temel çıktı formatı sağlar. Bu formatlar kod analizi, LLM context optimizasyonu ve proje dokümantasyonunda farklı amaçlara hizmet eder. Araç kapsamlı analiz için detaylı bir JSON raporu oluşturur, hem compact hem de detailed formatlarda LLM context dosyaları oluşturur ve hızlı paylaşım için pano entegrasyonunu destekler. Tüm export formatları dosya ve pano çıktıları arasında tutarlı yapı korur, farklı kullanım senaryolarında güvenilirlik sağlar.

**Bölüm kaynakları**
- [README.md](file://README.md#L1-L891)

## Detaylı JSON Raporu

Detaylı JSON raporu, tam metadata, özet istatistikler, dosya seviyesinde detaylar ve uygulanabilir olduğunda method seviyesinde verilerle kod tabanının kapsamlı analizini sağlar. Bu format `--save-report` flag'i kullanıldığında veya interactive modda uygun seçenek seçildiğinde oluşturulur.

Rapor yapısı üç ana bölümden oluşur:
- **metadata**: Oluşturma zaman damgası, proje kök yolu ve .gitignore ve calculator konfigürasyon dosyalarından konfigürasyon kurallarını içerir
- **summary**: Analiz edilen toplam dosyalar, token sayıları, dosya türü dağılımı ve en büyük dosyalar/dizinler gibi kapsamlı istatistikleri içerir
- **files**: Yol, token sayısı, boyut, satırlar ve uzantı dahil her analiz edilen dosya için detaylı bilgileri içerir

Method seviyesinde analiz `--method-level` flag'i ile etkinleştirildiğinde, dosya nesnelerinde ek method'a özgü veriler dahil edilir ve bireysel fonksiyonlar ve bunların token kullanımı hakkında granüler içgörüler sağlanır.

```mermaid
classDiagram
class DetailedJSONReport {
+metadata : object
+summary : object
+files : array
}
class Metadata {
+generatedAt : string
+projectRoot : string
+gitignoreRules : array
+calculatorRules : array
}
class Summary {
+totalFiles : number
+totalTokens : number
+byExtension : object
+largestFiles : array
+byDirectory : object
}
class File {
+path : string
+relativePath : string
+sizeBytes : number
+tokens : number
+lines : number
+extension : string
+methods? : array
}
DetailedJSONReport --> Metadata
DetailedJSONReport --> Summary
DetailedJSONReport --> File
```

**Diyagram kaynakları**
- [context-manager.js](file://context-manager.js#L784-L799)

**Bölüm kaynakları**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L784-L799)

## LLM Context Formatları

context-manager aracı farklı kullanım senaryoları için optimize edilmiş iki farklı LLM context formatı sunar: varsayılan olarak kullanılan ultra-compact format ve `--detailed-context` flag'i ile etkinleştirilen detailed format. Her iki format da token kullanımını minimize ederken AI asistanları için gerekli proje context'ini sağlamak üzere tasarlanmıştır.

### Compact Format (~2.3k karakter)

Varsayılan compact format, JSON formatında yaklaşık 2.3k karakter ile kod tabanının minimal ama yapılandırılmış bir temsilini sağlar. Bu format şunları içerir:
- Proje metadata'sı (kök dizin, toplam dosyalar, toplam tokenlar)
- Ortak önek sıkıştırmasıyla dizine göre gruplandırılmış organize dosya yolları
- Yer tasarrufu için dosya uzantılarının kaldırılması
- Gereksizliği minimize etmek için dizin gruplandırması

Compact format verimliliği önceliklendirir ve token ekonomisinin kritik olduğu sık AI etkileşimleri için idealdir. llm-context.json dosyasıyla tamamen aynı JSON yapısını korur.

### Detailed Format (~8.6k karakter)

`--detailed-context` ile etkinleştirilen detailed format, yaklaşık 8.6k karakterde daha kapsamlı bir context sağlar. Bu format şunları içerir:
- Uzantılarla tam dosya yolları
- Token sayısı ve proje yapısına dayalı önem skorları
- Dizin istatistikleri ve dosya kategorilendirmesi
- Method analizi etkinleştirildiğinde method seviyesinde veriler
- Proje anlayışı için ek metadata

Detailed format ilk proje analizi, kapsamlı dokümantasyon ve daha derin context anlayışı gerektiren durumlar için uygundur.

```mermaid
classDiagram
class LLMContext {
+project : object
+paths? : object
+methods? : object
+methodStats? : object
}
class ProjectMetadata {
+root : string
+totalFiles : number
+totalTokens : number
}
class Paths {
+directoryPath : array
}
class Methods {
+filePath : array
}
class MethodStats {
+totalMethods : number
+includedMethods : number
+totalMethodTokens : number
}
LLMContext --> ProjectMetadata
LLMContext --> Paths
LLMContext --> Methods
LLMContext --> MethodStats
```

**Diyagram kaynakları**
- [context-manager.js](file://context-manager.js#L482-L503)
- [context-manager.js](file://context-manager.js#L521-L545)
- [context-manager.js](file://context-manager.js#L505-L519)

**Bölüm kaynakları**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L482-L545)

## Pano Formatı

context-manager'daki pano formatı, dosya tabanlı export'larla aynı yapıyı korur ve farklı çıktı methodları arasında tutarlılık sağlar. `--context-clipboard` flag'i kullanıldığında, araç llm-context.json'a kaydedilecek olan aynı JSON yapısını doğrudan sistem panosuna kopyalar.

Uygulama platformlar arası pano işlemlerini yönetir:
- **macOS**: `pbcopy` komutunu kullanır
- **Linux**: Önce `xclip`'i dener, mevcut değilse `xsel`'e geri döner
- **Windows**: `clip` komutunu kullanır
- **Diğer platformlar**: Pano işlemi başarısız olursa dosya kaydetmeye fallback sağlar

Pano işlemi herhangi bir nedenle başarısız olursa, araç otomatik olarak context'i llm-context.json'a kaydeder, platform sınırlamalarına bakılmaksızın kullanıcının her zaman çıktıyı almasını sağlar.

```mermaid
sequenceDiagram
participant User
participant Tool as context-manager
participant Clipboard
participant File as llm-context.json
User->>Tool : --context-clipboard
Tool->>Tool : generateLLMContext()
Tool->>Clipboard : JSON'u Kopyala (platforma özel)
alt Başarılı
Clipboard-->>Tool : Başarılı
Tool-->>User : "Context panoya kopyalandı!"
else Başarısız
Tool->>File : saveContextToFile()
File-->>Tool : Kaydedildi
Tool-->>User : "Kopyalama başarısız... dosyaya kaydedildi"
end
```

**Diyagram kaynakları**
- [context-manager.js](file://context-manager.js#L547-L579)

**Bölüm kaynakları**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L547-L579)

## Kullanım Senaryoları ve Performans

Farklı çıktı formatları geliştirme iş akışlarında belirli kullanım senaryolarına hizmet eder:

**Compact Format Kullanım Senaryoları:**
- **LLM Entegrasyonu**: Tam proje context'i ile AI asistanları için yapılandırılmış veri
- **Programatik İşleme**: Otomatik araçlar ve scriptler için JSON formatı
- **Context Paylaşımı**: Pano ve dosya export'larında özdeş format
- **Geliştirme İş Akışları**: CI/CD ve otomasyon için tutarlı yapı

**Detailed Format Kullanım Senaryoları:**
- **Mimari Planlama**: Büyük kararlar için kapsamlı proje genel bakışı
- **Yeni Takım Üyesi Adaptasyonu**: Tam kod tabanı anlayışı
- **Dokümantasyon Oluşturma**: Tam proje yapısı analizi
- **Kod İnceleme Hazırlığı**: Detaylı dosya ilişkileri ve önemi

**Performans Değerlendirmeleri:**
- Compact format, tam kod tabanına kıyasla context boyutunu yaklaşık %89 azaltır
- Token sayımı, mevcut olduğunda GPT-4 uyumluluğu için tiktoken kullanır, tahmin fallback'i ile
- Dizin gruplandırması ve ortak önek sıkıştırması alan kullanımını optimize eder
- Method seviyesinde analiz ek yük ekler ancak odaklanmış hata ayıklama için granüler context sağlar

**Bölüm kaynakları**
- [README.md](file://README.md#L1-L891)

## Parsing Stratejileri

context-manager çıktılarının downstream işlemesi, formatlar arasında tutarlı JSON yapısından yararlanabilir:

**Detaylı JSON Raporları İçin:**
- Audit trail'leri ve versiyon takibi için metadata çıkarın
- Kod tabanı sağlık izleme için dosya seviyesinde istatistikleri analiz edin
- Kritik fonksiyonların odaklanmış analizi için method seviyesinde verileri işleyin
- Uzantı ve dizin istatistiklerinden görselleştirmeler oluşturun

**LLM Context Formatları İçin:**
- Kapsam ve ölçeği anlamak için proje metadata'sını parse edin
- Dizin yapısını yeniden oluşturmak için yol gruplarını gezin
- Hedefli kod analizi için method bilgilerini kullanın
- Yapılandırılmış proje context'ini kabul eden AI araçlarıyla entegre edin

**Genel Parsing Önerileri:**
- İşlemeden önce JSON yapısını doğrulayın
- İsteğe bağlı alanları (methods, methodStats) zarif bir şekilde ele alın
- Büyük raporlar için streaming parser'lar kullanın
- Tekrarlanan işlemden kaçınmak için parse edilmiş sonuçları önbelleğe alın
- Hatalı veya eksik veriler için hata yönetimi uygulayın

**Bölüm kaynakları**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L482-L545)
