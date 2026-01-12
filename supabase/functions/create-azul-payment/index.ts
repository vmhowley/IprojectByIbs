import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, amountString, taxString } = await req.json()

    // --- CONFIGURATION (Load from ENV in production) ---
    // For now, using placeholders or falling back to test values
    // In production, you would use: Deno.env.get('AZUL_MERCHANT_ID')
    const merchantId = Deno.env.get('AZUL_MERCHANT_ID') || '3900000000' // Default Test MerchantID
    const authKey = Deno.env.get('AZUL_AUTH_KEY') || 'test-key'     // IMPORTANT: SET THIS IN SUPABASE SECRETS
    const merchantName = Deno.env.get('AZUL_MERCHANT_NAME') || 'IBS Project Tracker'
    const merchantType = 'E-Commerce'
    const currencyCode = '$' // Default for Azul

    // --- URL CONSTRUCTION ---
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const approvedUrl = `${origin}/payment/azul/success`
    const declinedUrl = `${origin}/payment/azul/failure`
    const cancelUrl = `${origin}/pricing`

    // --- FIELDS ---
    // Amount & ITBIS format: "1000" = 10.00 (Last 2 digits are decimals, no dots)
    // We expect the frontend to pass formatted strings or we handle it here.
    // Let's assume frontend sends "2900" for $29.00
    
    const useCustomField1 = '0'
    const customField1Label = ''
    const customField1Value = ''
    const useCustomField2 = '0'
    const customField2Label = ''
    const customField2Value = ''

    // --- HASH CALCULATION ---
    // String to sign: MerchantID + MerchantName + MerchantType + CurrencyCode + OrderNumber + Amount + ITBIS + ApprovedUrl + DeclinedUrl + CancelUrl + UseCustomField1 + CustomField1Label + CustomField1Value + UseCustomField2 + CustomField2Label + CustomField2Value
    
    // IMPORTANT: Concatenation order matters strictly
    const rawString = merchantId + 
                      merchantName + 
                      merchantType + 
                      currencyCode + 
                      orderId + 
                      amountString + 
                      taxString + 
                      approvedUrl + 
                      declinedUrl + 
                      cancelUrl + 
                      useCustomField1 + 
                      customField1Label + 
                      customField1Value + 
                      useCustomField2 + 
                      customField2Label + 
                      customField2Value;

    // HMAC SHA512 Generation
    const encoder = new TextEncoder();
    const keyData = encoder.encode(authKey);
    const key = await crypto.subtle.importKey(
      "raw", 
      keyData, 
      { name: "HMAC", hash: "SHA-512" }, 
      false, 
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawString));
    
    // Convert signature to Hex String
    const authHash = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const payload = {
        formUrl: 'https://pruebas.azul.com.do/PaymentPage/Default.aspx', // Use env for production URL switch
        fields: {
            MerchantID: merchantId,
            MerchantName: merchantName,
            MerchantType: merchantType,
            CurrencyCode: currencyCode,
            OrderNumber: orderId,
            Amount: amountString,
            ITBIS: taxString,
            ApprovedUrl: approvedUrl,
            DeclinedUrl: declinedUrl,
            CancelUrl: cancelUrl,
            UseCustomField1: useCustomField1,
            CustomField1Label: customField1Label,
            CustomField1Value: customField1Value,
            UseCustomField2: useCustomField2,
            CustomField2Label: customField2Label,
            CustomField2Value: customField2Value,
            ShowTransactionResult: '1', 
            AuthHash: authHash,
            Locale: 'ES'
        }
    }

    return new Response(
      JSON.stringify(payload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
     return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
