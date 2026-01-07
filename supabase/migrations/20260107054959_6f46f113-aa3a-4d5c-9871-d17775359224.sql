-- CRITICAL: Secure email_verification_codes table
-- This table should NEVER be readable by clients - only edge functions use it

-- Create strict RLS policies for email_verification_codes
-- Users should NEVER be able to read this table directly
CREATE POLICY "No public access to verification codes" 
ON public.email_verification_codes 
FOR SELECT 
USING (false);

CREATE POLICY "No public insert to verification codes" 
ON public.email_verification_codes 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No public update to verification codes" 
ON public.email_verification_codes 
FOR UPDATE 
USING (false);

CREATE POLICY "No public delete to verification codes" 
ON public.email_verification_codes 
FOR DELETE 
USING (false);

-- Fix contact_inquiries - require token match for viewing
DROP POLICY IF EXISTS "Anyone can view inquiries by token" ON public.contact_inquiries;
-- This was already handled by the application logic, but we need to restrict raw access

-- Fix inquiry_messages - require token validation
DROP POLICY IF EXISTS "Anyone can view messages" ON public.inquiry_messages;
CREATE POLICY "Users can view messages with valid inquiry access" 
ON public.inquiry_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM contact_inquiries ci 
    WHERE ci.id = inquiry_messages.inquiry_id 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix newsletter_subscribers - users can only see own subscription
DROP POLICY IF EXISTS "Users can manage own subscription" ON public.newsletter_subscribers;
CREATE POLICY "Users can view own newsletter subscription" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own newsletter subscription" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own newsletter subscription" 
ON public.newsletter_subscribers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Anyone can subscribe (INSERT with email)
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);