# وضعیت دیتابیس افرا سفر

پروژه Supabase: `chrdvpwympsskclbvnsz`.

**نکته بسیار مهم:** در مراحل قبلی گفت‌وگو، جدول‌های `afra_profiles`، `afra_property_specs`، `afra_favorites`، `afra_search_history`، `afra_property_blocks`، `afra_special_rates`، `afra_support_tickets`، `afra_notifications`، `afra_reviews`، `afra_review_replies`، `afra_conversations` و `afra_messages` در دیتابیس واقعی ایجاد شده‌اند. ستون `guest_user_id` و محدودیت تاریخ‌های متداخل نیز به جدول `reservations` افزوده شده‌اند.

در **مرحله چهارم** هیچ تغییری روی اسکیمای دیتابیس اجرا نشده است؛ این مرحله فقط فایل‌های رابط کاربری را با ساختار فعلی همگام کرده است.

فایل `legacy_schema_DO_NOT_EXECUTE.sql.txt` فقط برای نگهداری نسخه تاریخی است. این نسخه قدیمی با دیتابیس فعلی اختلاف دارد و **نباید در SQL Editor اجرا شود**. با اجرای دوباره ممکن است توابع و مجوزهای درست فعلی تغییر کنند.

برای پایگاه داده دیگر، ابتدا اسکیمای آن را جداگانه مقایسه و یک migration مناسب همان پروژه تهیه کنید. کلید secret/service_role را هرگز داخل فایل HTML یا JavaScript عمومی قرار ندهید.
