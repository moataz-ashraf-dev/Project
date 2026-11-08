# StudyQuest Admin Portal

لوحة التحكم خاصة بالمدير فقط وليست جزءًا من واجهة العميل.

## مسار ملفات لوحة التحكم داخل المشروع
`src/components/AdminDashboard.tsx`

## مسار الوصول داخل التطبيق
`/admin` — يجب أن يكون الحساب مصرحًا له بدور `admin` من Supabase.

## ملفات قاعدة البيانات
`supabase/migrations/20260918250000_admin_control_center.sql`

لا تضع مفاتيح Paymob السرية أو Service Role Key داخل ملفات الواجهة.
