# Sorun Giderme

<cite>
**Bu Dokümanda Referans Verilen Dosyalar**
- [context-manager.js](file://context-manager.js) - *6f5fea32 commit'inde güncellendi*
- [README.md](file://README.md) - *6f5fea32 commit'inde güncellendi*
- [bin/cli.js](file://bin/cli.js)
- [lib/formatters/gitingest-formatter.js](file://lib/formatters/gitingest-formatter.js) - *6f5fea32 commit'inde eklendi*
- [lib/parsers/method-filter-parser.js](file://lib/parsers/method-filter-parser.js) - *6f5fea32 commit'inde eklendi*
</cite>

## İçindekiler
1. [Include/Exclude Mod Karışıklığı](#includeexclude-mod-karışıklığı)
2. [Desen Eşleştirme Sorunları](#desen-eşleştirme-sorunları)
3. [Token Sayımı Tutarsızlıkları](#token-sayımı-tutarsızlıkları)
4. [Analizde Eksik Dosyalar](#analizde-eksik-dosyalar)
5. [Beklenmeyen Dosya Dahil Edilmeleri](#beklenmeyen-dosya-dahil-edilmeleri)
6. [Büyük Kod Tabanlarında Performans Sorunları](#büyük-kod-tabanlarında-performans-sorunları)
7. [Tanı Adımları](#tanı-adımları)
8. [Yaygın Ortam Sorunları](#yaygın-ortam-sorunları)
9. [GitIngest Digest Üretim Sorunları](#gitingest-digest-uretim-sorunları)
10. [Method Seviyesi Filtreleme Sorunları](#method-seviyesi-filtreleme-sorunları)

## Include/Exclude Mod Karışıklığı

context-manager aracı, dosya dahil etme ve hariç tutma için öncelik tabanlı bir sistem kullanır. Bir `.contextinclude` dosyasının varlığı `.contextignore` üzerinde öncelik alır, bu da kullanıcılar dosyaların dahil edilmesini beklediğinde ancak hariç tutulduğunda karışıklığa yol açabilir.

`.contextinclude` mevcut olduğunda, araç INCLUDE modunda çalışır, yani yalnızca bu dosyadaki desenlere uyan dosyalar analize dahil edilecektir. Bu, tüm `.contextignore` kurallarını geçersiz kılar. Kullanıcılar `.contextignore` konfigürasyonlarına göre dosyaların dahil edilmesini bekleyebilirler, ancak bir `.contextinclude` dosyası mevcutsa, bu beklentiler karşılanmayacaktır.

Araç, yürütme sırasında hangi modun aktif olduğunu açıkça gösterir. INCLUDE modunda "📅 Found calculator config - using INCLUDE mode" görüntülerken, EXCLUDE modunda "📅 Found calculator config - using EXCLUDE mode" gösterir. Bu görsel ipucu, mevcut filtreleme modunu belirlemeye yardımcı olur.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L134-L157)
- [context-manager.js](file://context-manager.js#L181-L217)
- [README.md](file://README.md#L121-L150)

## Desen Eşleştirme Sorunları

context-manager aracındaki desen eşleştirme, kullanıcıların `.contextignore` ve `.methodinclude` dosyalarını doğru yapılandırmaları için anlamaları gereken özel sözdizimi kurallarını takip eder. Yaygın sorunlar arasında yanlış sözdizimi, eksik negasyon desenleri ve wildcard davranışının yanlış anlaşılması yer alır.

Araç, eşleştirme için desenleri regex'lere dönüştürür, belirli dönüşümlerle:
- `**`, `.*` olur (herhangi bir sayıda dizini eşleştirir)
- `*`, `[^/]*` olur (dizin ayırıcılar hariç herhangi bir karakteri eşleştirir)
- `?`, `[^/]` olur (dizin ayırıcılar hariç herhangi bir tek karakteri eşleştirir)

Negasyon desenleri (`!` ile başlayan), INCLUDE ve EXCLUDE modlarında farklı şekilde çalışır. INCLUDE modunda, negasyon desenleri dahil edilen setten dosyaları hariç tutar, EXCLUDE modunda ise başka türlü hariç tutulacak dosyaları yeniden dahil ederler. Yaygın bir hata, negasyon desenlerini yanlış sıraya yerleştirmektir, çünkü araç desenleri sırayla işler.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L159-L179)
- [context-manager.js](file://context-manager.js#L219-L257)
- [README.md](file://README.md#L544-L610)

## Token Sayımı Tutarsızlıkları

context-manager aracı hem kesin hem de tahmini token sayıları sağlar, bu da kullanıcıların kafa karıştırıcı bulabileceği tutarsızlıklara yol açabilir. Araç önce kesin GPT-4 uyumlu token sayımı için tiktoken kütüphanesini kullanmayı dener. tiktoken mevcut değilse, bir tahmin algoritmasına geri döner.

Tahmin algoritması, farklı dosya türleri için önceden tanımlanmış karakter başına token oranları kullanır:
- JavaScript/TypeScript: Token başına 3.2 karakter
- JSON: Token başına 2.5 karakter
- Markdown: Token başına 4.0 karakter
- HTML/XML: Token başına 2.8 karakter
- Varsayılan: Token başına 3.5 karakter

Bu tahminler genellikle kesin sayımlara kıyasla yaklaşık %95 doğrudur. Kullanıcılar, tahmini sayımlar ile diğer araçlardan bekledikleri arasında farklılıklar fark edebilirler. Araç çıktıda hangi sayım methodunun kullanıldığını açıkça gösterir: kesin sayımlar için "🎯 Token calculation: ✅ Exact (using tiktoken)" veya tahminler için "🎯 Token calculation: ⚠️ Estimated".

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L259-L292)
- [context-manager.js](file://context-manager.js#L385-L400)
- [README.md](file://README.md#L801-L879)

## Analizde Eksik Dosyalar

Dosyalar, çok katmanlı filtreleme sistemi nedeniyle analizden eksik olabilir. Araç, öncelik sırasına göre üç seviye konfigürasyon dosyasına saygı gösterir:
1. `.gitignore` (her zaman saygı gösterilir)
2. `.contextinclude` (dahil etme için en yüksek öncelik)
3. `.contextignore` (include dosyası yoksa kullanılır)

Bir dosya, bu mekanizmalardan herhangi biri tarafından hariç tutulmuşsa analizden eksik olabilir. Bir dosya `.contextignore`'da açıkça belirtilmemiş olsa bile, `**/*.md` veya `node_modules/**` gibi bir desen tarafından hariç tutulabilir. Kullanıcılar bir dosyanın neden eksik olduğunu anlamak için her üç konfigürasyon dosyasını da kontrol etmelidir.

Ek olarak, araç yalnızca dosya uzantısı ve basename ile belirlenen metin dosyalarını analiz eder. Tanınan metin uzantıları listesinde olmayan uzantılara veya metin dosyaları listesinde olmayan basename'lere sahip dosyalar, açıkça göz ardı edilmemiş olsalar bile tamamen atlanacaktır.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L181-L217)
- [context-manager.js](file://context-manager.js#L414-L453)
- [README.md](file://README.md#L294-L356)

## Beklenmeyen Dosya Dahil Edilmeleri

Beklenmeyen dosya dahil edilmeleri, kullanıcılar farklı konfigürasyon dosyaları arasındaki etkileşimi yanlış anladıklarında meydana gelebilir. En yaygın neden, kullanıcı EXCLUDE modu davranışı beklediğinde bir `.contextinclude` dosyasının varlığıdır. INCLUDE modunda, yalnızca `.contextinclude`'daki desenlere uyan dosyalar dahil edilir, bu da kullanıcının hariç tutulmasını beklediği dosyaları dahil edebilir.

Başka bir neden, uygun negasyon olmadan `**/*.js` gibi geniş desenlerin kullanılmasıdır. Örneğin, bir kullanıcı test dizinlerindekiler hariç tüm JavaScript dosyalarını dahil etmek istiyorsa, `!**/*.test.js` veya `!test/**` gibi bir negasyon desenini açıkça eklemesi gerekir.

Aracın verbose çıktısı, dosyaların neden dahil edildiğini belirlemeye yardımcı olabilir. `--verbose` flag'i ile çalıştırıldığında, araç hangi modun aktif olduğunu gösterir ve dahil etme mantığını izlemeye yardımcı olabilir.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L134-L157)
- [context-manager.js](file://context-manager.js#L181-L217)
- [README.md](file://README.md#L544-L610)

## Büyük Kod Tabanlarında Performans Sorunları

Büyük kod tabanlarındaki performans sorunları genellikle aracın proje dizinindeki her dosyayı taraması ve analiz etmesi gereğinden kaynaklanır. Tarama işlemi dizinleri özyinelemeli olarak geçer, bu da çok sayıda dosya içeren derin iç içe yapılar için yavaş olabilir.

Araç, performansı artırmak için `node_modules`, `.git`, `dist` ve `build` gibi belirli dizinleri otomatik olarak atlar. Ancak, bir kod tabanında analiz edilebilir kategorilerde (JavaScript, TypeScript, Markdown, vb.) çok sayıda dosya varsa, analiz hala zaman alabilir.

Method seviyesinde analiz (`--method-level` flag'i), aracın her dosyayı method tanımlarını çıkarmak için parse etmesi ve her method için ayrı ayrı token hesaplaması gerektiğinden işleme süresini önemli ölçüde artırır. Çok büyük kod tabanları için, bu fark edilir gecikmelere neden olabilir.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L455-L485)
- [context-manager.js](file://context-manager.js#L521-L545)
- [bin/cli.js](file://bin/cli.js#L20-L35)

## Tanı Adımları

context-manager aracı ile ilgili sorunları tanılamak için, kullanıcılar şu adımları izlemelidir:

1. Hangi dosyaların işlendiği ve hangi kuralların uygulandığı hakkında detaylı çıktı görmek için aracı `--verbose` flag'i ile çalıştırın.

2. Hangi modun aktif olduğunu (INCLUDE veya EXCLUDE) ve hangi konfigürasyon dosyasının kullanıldığını belirlemek için ilk çıktıyı kontrol edin.

3. İşlenen tüm dosyalar, bunların token sayıları ve hangi kuralların uygulandığı hakkında bilgi içeren detaylı bir JSON raporu oluşturmak için `--save-report` seçeneğini kullanın.

4. Çakışan veya yanlış desenler için konfigürasyon dosyalarını (`.gitignore`, `.contextignore`, `.contextinclude`) inceleyin.

5. Kesin token sayıları gerekiyorsa tiktoken bağımlılığının yüklendiğini doğrulayın.

Araç çıktısında tanıya yardımcı olan açık görsel göstergeler sağlar, örneğin `.gitignore` kuralları ile calculator kuralları nedeniyle göz ardı edilen dosyaların sayısı ve kesin veya tahmini token sayımının kullanılıp kullanılmadığı.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L609-L643)
- [context-manager.js](file://context-manager.js#L715-L743)
- [bin/cli.js](file://bin/cli.js#L41-L66)

## Yaygın Ortam Sorunları

Yaygın ortam sorunları arasında eksik bağımlılıklar ve izin hataları yer alır. En sık karşılaşılan bağımlılık sorunu, kesin token sayımı için gerekli olan tiktoken kütüphanesinin yokluğudur. tiktoken yüklü olmadığında, araç otomatik olarak tahmin moduna geri döner, ancak doğru sonuçlar için kullanıcılar `npm install tiktoken` ile yüklemelidir.

İzin hataları, araç kod tabanındaki belirli dosya veya dizinlere okuma erişimine sahip olmadığında meydana gelebilir. Bu, aracı kısıtlı ortamlarda çalıştırırken veya dosya izinleri çok dar ayarlandığında olabilir. Kullanıcılar, aracın analiz etmek istedikleri tüm dosyalar için uygun okuma izinlerine sahip olduğundan emin olmalıdır.

Diğer bir yaygın sorun, aracı yanlış dizinden çalıştırmaktır. Araç varsayılan olarak mevcut çalışma dizinini analiz eder, bu nedenle kullanıcılar komutu yürütürken doğru proje kök dizininde olduklarından emin olmalıdır.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L259-L292)
- [context-manager.js](file://context-manager.js#L825-L840)
- [README.md](file://README.md#L294-L356)

## GitIngest Digest Üretim Sorunları

GitIngest-style digest formatlamasının uygulanmasıyla, digest üretimiyle ilgili yeni sorunlar ortaya çıkabilir. `--gitingest` flag'i LLM tüketimi için tek dosyalık bir digest oluşturur, ancak kullanıcılar bu özellikle ilgili sorunlarla karşılaşabilir.

Yaygın sorunlar şunları içerir:
- `--gitingest` flag'i kullanıldığında digest.txt çıktısı eksik
- Oluşturulan digest'teki yanlış token tahminleri
- Dizin ağacı yapısı gerçek proje yapısını yansıtmıyor
- Digest çıktısında dosya içerikleri eksik

GitIngestFormatter, `.methodinclude` veya `.methodignore` dosyaları mevcut olduğunda method seviyesi filtrelemeyi otomatik olarak algılar ve uygular. Method filtreleme aktifse, digest methodlar için INCLUDE veya EXCLUDE modunun aktif olup olmadığını belirten bir not içerecektir.

`--gitingest-from-report` veya `--gitingest-from-context` kullanarak mevcut JSON raporlarından digest oluştururken, belirtilen JSON dosyasının var olduğundan ve doğru yapıya sahip olduğundan emin olun. Araç, dosya bulunamazsa veya geçersiz formata sahipse bir hata mesajı görüntüler.

**Bölüm kaynakları**
- [context-manager.js](file://context-manager.js#L294-L382)
- [lib/formatters/gitingest-formatter.js](file://lib/formatters/gitingest-formatter.js#L1-L269)
- [README.md](file://README.md#L100-L150)

## Method Seviyesi Filtreleme Sorunları

Method seviyesi filtreleme, kullanıcıların `.methodinclude` ve `.methodignore` dosyalarını kullanarak belirli metodları analize dahil etmesine veya hariç tutmasına olanak tanır. Bu dosyalar doğru şekilde yapılandırılmadığında sorunlar ortaya çıkabilir.

MethodFilterParser bu dosyaları işler ve desenleri düzgün ifadelere dönüştürür. Desenler, regex'te `.*`'a dönüştürülen wildcard'ları (`*`) destekler. Desenler büyük/küçük harfe duyarsızdır ve method adlarını veya dosya.method kombinasyonlarını eşleştirebilir.

Yaygın sorunlar şunları içerir:
- Yanlış sözdizimi nedeniyle desenler beklenen metodlarla eşleşmiyor
- Negasyon desenleri beklenildiği gibi çalışmıyor
- Method filtreleme beklenildiğinde uygulanmıyor

Araç, method filtre kuralları yüklendiginde mesajlar loglar:
- `.methodinclude` algılandığında "🔧 Method include rules loaded: X patterns"
- `.methodignore` algılandığında "🚫 Method ignore rules loaded: X patterns"

Method filtreleme, digest oluştururken GitIngestFormatter tarafından otomatik olarak algılanır ve uygulanır, normal analiz ve digest üretimi arasında tutarlı davranış sağlar.

**Bölüm kaynakları**
- [lib/parsers/method-filter-parser.js](file://lib/parsers/method-filter-parser.js#L1-L51)
- [lib/formatters/gitingest-formatter.js](file://lib/formatters/gitingest-formatter.js#L15-L25)
- [README.md](file://README.md#L200-L250)
