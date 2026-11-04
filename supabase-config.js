/* ===== Supabase ulanish sozlamalari =====
   Supabase → Project Settings → API (yoki "Connect") bo'limidan oling:
     url     — Project URL, masalan: https://abcdxyz.supabase.co
     anonKey — "anon public" yoki "publishable" kalit (sb_publishable_... yoki eyJ... bilan boshlanadi)

   Bu kalitlar brauzer uchun mo'ljallangan va ochiq bo'lishi mumkin — ma'lumotlarni
   bazadagi Row Level Security qoidalari himoya qiladi.
   ⚠️ HECH QACHON bu yerga "service_role" yoki "secret" kalitni qo'ymang!

   Ikkalasi bo'sh qolsa, sayt avvalgidek faqat demo rejimda ishlaydi. */
window.SUPABASE_CONFIG = {
  url: 'https://pdzianoebvxroytmssmk.supabase.co',
  anonKey: 'sb_publishable_S46iHxquNimmkV_YbUBh1w_217FpK6Q'
};
