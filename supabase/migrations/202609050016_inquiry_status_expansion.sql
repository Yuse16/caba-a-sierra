alter type public.inquiry_status add value if not exists 'confirmed';
alter type public.inquiry_status add value if not exists 'no_response';
alter type public.inquiry_status add value if not exists 'cancelled';
alter type public.inquiry_status add value if not exists 'completed';
