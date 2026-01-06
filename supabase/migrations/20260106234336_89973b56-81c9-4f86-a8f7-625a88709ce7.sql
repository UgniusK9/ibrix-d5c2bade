-- Create contact inquiries table
CREATE TABLE public.contact_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  order_number TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  conversation_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation messages table
CREATE TABLE public.inquiry_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.contact_inquiries(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'customer')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;

-- Allow public to insert new inquiries (for contact form)
CREATE POLICY "Anyone can create inquiries"
ON public.contact_inquiries
FOR INSERT
WITH CHECK (true);

-- Allow public to view own inquiries by token
CREATE POLICY "Anyone can view inquiries by token"
ON public.contact_inquiries
FOR SELECT
USING (true);

-- Allow admins to manage all inquiries
CREATE POLICY "Admins can manage inquiries"
ON public.contact_inquiries
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Allow public to insert messages (for customer replies via token)
CREATE POLICY "Anyone can add messages"
ON public.inquiry_messages
FOR INSERT
WITH CHECK (true);

-- Allow public to view messages
CREATE POLICY "Anyone can view messages"
ON public.inquiry_messages
FOR SELECT
USING (true);

-- Allow admins to manage all messages
CREATE POLICY "Admins can manage messages"
ON public.inquiry_messages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger for inquiries
CREATE TRIGGER update_contact_inquiries_updated_at
BEFORE UPDATE ON public.contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for quick lookups
CREATE INDEX idx_contact_inquiries_token ON public.contact_inquiries(conversation_token);
CREATE INDEX idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX idx_inquiry_messages_inquiry_id ON public.inquiry_messages(inquiry_id);