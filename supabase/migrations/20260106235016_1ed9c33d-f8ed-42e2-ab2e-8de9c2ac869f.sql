-- Enable realtime for contact_inquiries and inquiry_messages tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiry_messages;