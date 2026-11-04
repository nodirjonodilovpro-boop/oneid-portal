# OneID — Davlat Raqamli Portali (demo)

> ⚠️ **O'quv / demo loyiha.** Bu haqiqiy davlat OneID tizimi emas. Haqiqiy login, parol yoki shaxsiy ma'lumotlaringizni kiritmang. Rasmiy sayt: [id.egov.uz](https://id.egov.uz)

Fuqaroning yagona raqamli kabineti konsepsiyasi: xavfsiz kirish (2FA), raqamli ID-karta va pasport, hujjatlar portfeli, mulk va transport reestri, chegara kesib o'tish tarixi hamda hujjat muddatlari nazorati. Dizayn Google Stitch'da chizilgan ekranlar asosida sof HTML, CSS va JavaScript'da yozilgan.

🔗 **Jonli sayt:** https://nodirjonodilovpro-boop.github.io/oneid-portal/

## Demo orqali kirish

1. **Login & Parol** oynasiga istalgan login yozing (masalan `31205840250019`) va kamida 4 belgili parol kiriting.
2. "Kiber-himoya kodi" misolini yeching va **OneID orqali Kirish** tugmasini bosing.
3. PIN-kod sahifasida **`12345`** ni kiriting (ekrandagi tugmalar yoki klaviatura bilan).
4. 5 soniyadan keyin shaxsiy kabinet avtomatik ochiladi.

Boshqa kirish usullari: E-IMZO (istalgan kalit paroli), QR-kod (skanerlash simulyatsiyasi), Mobile-ID (9 xonali telefon raqami).

## Sahifalar

| Bo'lim | Imkoniyatlar |
|---|---|
| **Kirish** | 4 xil usul, parolni ko'rsatish, kiber-himoya kodi, xatoliklarni tekshirish |
| **PIN / 2FA** | 5 xonali PIN, SMS OTP, Mobile Push, biometriya, urinishlar hisobi |
| **Muvaffaqiyatli kirish** | Avtomatik yo'naltirish taymeri, sessiya auditi, fuqaro kartasi |
| **Boshqaruv & Pasport** | ID-karta, har 2 daqiqada yangilanadigan dinamik QR, statistika, eslatmalar |
| **Hujjatlar portfeli** | Qidiruv va toifalar bo'yicha saralash |
| **Mulk va Transport** | Avtomobil, ko'chmas mulk, SIM-kartalarni bloklash, ishonchnomalar |
| **Sayohat & Chegara** | Xorijga chiqish pasporti, taqiqni tekshirish, chegara tarixi, vizalar |
| **Muddatlar & Eslatmalar** | Shoshilinch / yaqinlashayotgan / xavfsiz hujjatlar, OSAGO'ni onlayn uzaytirish |
| **Xavfsizlik & Sozlamalar** | 2FA, biometriya va bildirishnoma sozlamalari, faol sessiyalar, PIN almashtirish |

Sayt moslashuvchan: kompyuterda chap menyu, telefonda pastki menyu bilan ishlaydi.

## Texnologiyalar

- HTML5, CSS3 (CSS o'zgaruvchilari, Grid, Flexbox), Vanilla JavaScript (hash routing asosidagi SPA)
- Shriftlar: Inter, JetBrains Mono; ikonkalar: Material Symbols (Google Fonts)
- Hech qanday kutubxona yoki build jarayoni talab qilinmaydi

## Lokal ishga tushirish

`index.html` faylini brauzerda oching. Yoki loyiha papkasida lokal server ishga tushiring:

```bash
python -m http.server 5500
```

Keyin http://localhost:5500 manzilini oching. Shriftlar va ikonkalar yuklanishi uchun internet kerak.

## Fayllar

```
index.html   — sahifa skeleti
index.css    — barcha uslublar va moslashuvchan dizayn
index.js     — sahifalar, marshrutlash va interaktivlik
```

## Eslatma

Barcha ma'lumotlar (F.I.Sh, JShShIR, hujjat raqamlari va h.k.) to'qima namunadir. Sayt hech qanday serverga ma'lumot yubormaydi. Kirish holati faqat brauzerning `sessionStorage`'ida saqlanadi.
