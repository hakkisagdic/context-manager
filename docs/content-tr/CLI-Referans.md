# CLI Referans

<cite>
**Bu Dokümanda Referans Verilen Dosyalar**
- [bin/cli.js](file://bin/cli.js)
- [context-manager.js](file://context-manager.js)
- [README.md](file://README.md)
</cite>

## İçindekiler
1. [Giriş](#giriş)
2. [Komut Sözdizimi](#komut-sözdizimi)
3. [Kullanılabilir Seçenekler](#kullanılabilir-seçenekler)
4. [İnteraktif Export Seçimi](#interaktif-export-seçimi)
5. [Kullanım Örnekleri](#kullanım-örnekleri)
6. [Exit Code'lar ve Hata Yönetimi](#exit-codelar-ve-hata-yönetimi)
7. [Performans Değerlendirmeleri](#performans-değerlendirmeleri)
8. [Shell Script Entegrasyonu](#shell-script-entegrasyonu)
9. [Sorun Giderme Rehberi](#sorun-giderme-rehberi)

## Giriş
context-manager CLI, kod tabanlarını analiz etmek ve LLM tüketimi için context'i optimize etmek üzere kapsamlı bir araç sağlar. Method seviyesinde filtreleme, kesin token sayımı ve AI destekli geliştirme iş akışlarını desteklemek için birden fazla export formatı sunar. Araç hem .gitignore hem de özel ignore/include kurallarına saygı gösterir ve farklı analiz senaryoları için esnek konfigürasyon seçenekleri sağlar.

**Bölüm kaynakları**
- [README.md](file://README.md#L0-L891)

## Komut Sözdizimi
context-manager CLI için temel sözdizimi:
```
context-manager [options]
```

Komut, analiz davranışını, çıktı formatını ve export hedeflerini kontrol eden çeşitli seçenekleri kabul eder. Hiçbir seçenek belirtilmediğinde, araç interactive modda çalışır ve analiz tamamlandıktan sonra kullanıcıdan export seçeneklerini seçmesini ister.

**Bölüm kaynakları**
- [bin/cli.js](file://bin/cli.js#L4-L25)
- [context-manager.js](file://context-manager.js#L815-L830)

## Kullanılabilir Seçenekler
context-manager CLI aşağıdaki seçenekleri destekler:

### --save-report (-s)
Analizin detaylı JSON raporunu proje kök dizininde token-analysis-report.json olarak kaydeder.

**Davranış**: Metadata, özet istatistikleri ve analiz edilen her dosya hakkında detaylı bilgileri içeren kapsamlı bir rapor oluşturur.

**Dönüş değeri**: Yapılandırılmış analiz verisi içeren token-analysis-report.json dosyası oluşturur.

### --no-verbose
Verbose çıktı modunu devre dışı bırakır, analiz sırasında dahil edilen dosya ve dizinlerin görüntülenmesini engeller.

**Davranış**: İşlenen dosyaların listesini göstermeden analizi çalıştırır, daha temiz bir çıktı sağlar.

**Dönüş değeri**: Dosya listeleme detayları olmadan standart analiz raporu.

### --context-export
Bir LLM context dosya listesi oluşturur ve bunu proje kök dizininde llm-context.json olarak kaydeder.

**Davranış**: LLM tüketimi için uygun optimize edilmiş proje context'i içeren bir JSON dosyası oluşturur.

**Dönüş değeri**: Proje metadata'sı ve organize edilmiş dosya yolları içeren llm-context.json dosyası oluşturur.

### --context-clipboard
LLM context'ini doğrudan sistem panosuna kopyalar.

**Davranış**: Context'i JSON formatında oluşturur ve platforma özel komutlar kullanarak panoya kopyalar (macOS'ta pbcopy, Linux'ta xclip/xsel, Windows'ta clip).

**Dönüş değeri**: Context verisi panoya kopyalanır; başarı durumunda karakter sayısını gösterir.

### --detailed-context
Varsayılan compact format yerine detailed context formatını kullanır.

**Davranış**: Ek metadata, kategoriler ve önem skorları ile daha kapsamlı bir context çıktısı oluşturur.

**Dönüş değeri**: Gelişmiş bilgilerle daha büyük context çıktısı (~8.6k karakter).

### --method-level (-m)
Method seviyesinde analiz modunu etkinleştirir.

**Davranış**: JavaScript/TypeScript dosyalarından bireysel methodları çıkarır ve analiz eder, .methodinclude ve .methodignore dosyalarından method seviyesinde filtreleme kurallarını uygular.

**Dönüş değeri**: Method adları, satır numaraları ve token sayıları dahil olmak üzere çıktıya method'a özgü bilgileri dahil eder.

### --help (-h)
Kullanılabilir seçenekler ve kullanım örnekleri ile yardım mesajını görüntüler.

**Davranış**: Yardım metnini stdout'a yazdırır ve çıkar.

**Dönüş değeri**: Yok; yardımı görüntüledikten sonra programı sonlandırır.

**Bölüm kaynakları**
- [README.md](file://README.md#L0-L891)
- [bin/cli.js](file://bin/cli.js#L4-L25)

## İnteraktif Export Seçimi
context-manager herhangi bir export seçeneği (--save-report, --context-export veya --context-clipboard) belirtilmeden çalıştırıldığında, otomatik olarak interactive export seçimi özelliğini etkinleştirir. Analiz tamamlandıktan sonra, araç dört export seçeneği içeren bir menü sunar:

1. Detaylı JSON raporu kaydet (token-analysis-report.json)
2. LLM context dosyası oluştur (llm-context.json)
3. LLM context'ini panoya kopyala
4. Export yok (atla)

Kullanıcıdan tercih ettiği export seçeneğini seçmek için bir sayı (1-4) girmesi istenir. Bu interactive mod, kullanıcıların analiz sonuçlarını inceledikten sonra en uygun export formatını seçmelerini sağlar ve değerli context verisini export etme fırsatlarını kaçırmalarını önler.

**Bölüm kaynakları**
- [README.md](file://README.md#L0-L891)
- [context-manager.js](file://context-manager.js#L618-L637)

## Kullanım Örnekleri
Aşağıdaki örnekler yaygın komut kombinasyonlarını gösterir:

### Method seviyesinde analiz ile panoya export
```bash
context-manager --method-level --context-clipboard
```
Bu komut method seviyesinde analiz yapar ve sonuç context'ini panoya kopyalar, odaklanmış kod context'ini AI asistanları ile hızlıca paylaşmak için idealdir.

### Verbose çıktı ile rapor kaydetme
```bash
context-manager --save-report --verbose
```
Bu kombinasyon, analiz sırasında tüm dahil edilen dosyaları gösterirken detaylı bir JSON raporu kaydeder, kapsamlı kod tabanı incelemeleri için yararlıdır.

### Birden fazla çıktı ile kombine analiz
```bash
context-manager --method-level --save-report --context-export --verbose
```
Bu komut, hem detaylı bir rapor hem de bir LLM context dosyası oluştururken verbose çıktı ile method seviyesinde analiz yapar, CI/CD pipeline'ları ve kapsamlı kod tabanı dokümantasyonu için uygundur.

**Bölüm kaynakları**
- [README.md](file://README.md#L0-L891)

## Exit Code'lar ve Hata Yönetimi
context-manager CLI güçlü hata yönetim mekanizmaları uygular:

- **Başarı (exit code 0)**: Analiz tüm istenen işlemler gerçekleştirilerek başarıyla tamamlandı.
- **Geçersiz seçenek (exit code 1)**: Komut tanınmayan veya hatalı biçimlendirilmiş seçeneklerle çağrıldı.
- **Dosya sistemi hatası (exit code 1)**: Analiz sırasında dosya veya dizinlere erişimde sorunlar.
- **Pano hatası**: Pano işlemleri başarısız olduğunda, araç bir uyarı mesajıyla context'i llm-context.json'a kaydetmeye geri döner.

Araç, eksik konfigürasyon dosyalarını zarif bir şekilde ele alır ve bilgilendirici hata mesajları sağlar. tiktoken kesin token sayımı için mevcut olmadığında, bir uyarıyla akıllı tahmin yöntemine geri döner.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L750-L772)
- [test/test-suite.js](file://test/test-suite.js#L0-L280)

## Performans Değerlendirmeleri
Büyük kod tabanlarını analiz ederken, aşağıdaki performans optimizasyonlarını göz önünde bulundurun:

- Analizi yalnızca gerekli dosyalarla sınırlamak için .calculatorinclude kullanın
- Belirli işlevselliğe odaklanmak için method seviyesinde analizi etkinleştirin
- Çıktı işlemeyi azaltmak için büyük repolar için verbose modu kullanmaktan kaçının
- Daha hızlı işleme ve daha küçük çıktı için compact context formatını kullanın

Araç, verimli dizin taraması ve token sayma algoritmaları ile performans için optimize edilmiştir. Çok büyük kod tabanları için, ilk tarama birkaç saniye sürebilir, ancak sonraki analizler işlenen dosya sayısını azaltan filtreleme kurallarından faydalanır.

**Bölüm kaynakları**
- [README.md](file://README.md#L0-L891)
- [context-manager.js](file://context-manager.js#L225-L790)

## Shell Script Entegrasyonu
context-manager CLI, otomatik iş akışları için shell scriptlere entegre edilebilir:

```bash
# Kod tabanının token bütçesini aşıp aşmadığını kontrol et
TOKENS=$(context-manager --context-export --no-verbose | jq '.project.totalTokens')
if [ $TOKENS -gt 100000 ]; then
  echo "Kod tabanı LLM context için çok büyük!"
  exit 1
fi
```

```bash
# Zaman damgalı raporlarla günlük analiz
context-manager --save-report > reports/analysis-$(date +%Y%m%d).json
```

Aracın öngörülebilir çıktı formatı ve exit code'ları, CI/CD pipeline'larında, pre-commit hook'larında ve otomatik dokümantasyon oluşturma iş akışlarında kullanım için uygun hale getirir.

**Bölüm kaynakları**
- [README.md](file://README.md#L0-L891)

## Sorun Giderme Rehberi
### Komut bulunamadı
Paketin global olarak yüklendiğinden emin olun:
```bash
npm install -g @hakkisagdic/context-manager
```

### Geçersiz seçenekler
Seçenek adlarını ve sözdizimini doğrulayın. Geçerli seçenekleri görmek için --help kullanın.

### İzin hataları
Bazı sistemlerde, pano işlemleri ek izinler gerektirebilir. Araç, pano erişimi reddedildiğinde otomatik olarak dosya çıktısına geri döner.

### Eksik beklenen dosyalar
Dosyaların .gitignore veya calculator kuralları tarafından hariç tutulup tutulmadığını kontrol edin. Hangi dosyaların işlendiğini görmek için verbose modunu kullanın.

### Token sayımı tutarsızlıkları
Kesin token sayımı için tiktoken'ın yüklendiğinden emin olun. tiktoken olmadan, araç dosya türüne dayalı tahmin kullanır.

**Bölüm kaynakları**
- [README.md](file://README.md#L0-L891)
- [test/test.js](file://test/test.js#L0-L61)
