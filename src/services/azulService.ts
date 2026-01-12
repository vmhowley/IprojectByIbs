import { supabase } from './api';

interface AzulPaymentResponse {
  formUrl: string;
  fields: {
    MerchantID: string;
    MerchantName: string;
    MerchantType: string;
    CurrencyCode: string;
    OrderNumber: string;
    Amount: string;
    ITBIS: string;
    ApprovedUrl: string;
    DeclinedUrl: string;
    CancelUrl: string;
    UseCustomField1: string;
    CustomField1Label: string;
    CustomField1Value: string;
    UseCustomField2: string;
    CustomField2Label: string;
    CustomField2Value: string;
    ShowTransactionResult: string;
    AuthHash: string;
    Locale: string;
  };
}

export const azulService = {
  /**
   * Initiates payment flow by fetching the signed form data from the backend
   * and auto-submitting a form to Azul's Payment Page.
   */
  async initiatePayment(orderId: string, amount: number, tax: number = 0) {
    try {
      // 1. Format amounts (remove decimals, e.g., 29.00 -> "2900")
      const amountString = Math.round(amount * 100).toString();
      const taxString = Math.round(tax * 100).toString();

      // 2. Call Edge Function to get signed payload
      const { data, error } = await supabase.functions.invoke('create-azul-payment', {
        body: { 
            orderId, 
            amountString, 
            taxString 
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No data received from Azul signing service');

      const response = data as AzulPaymentResponse;

      // 3. Create and submit a hidden form
      this.submitHiddenForm(response.formUrl, response.fields);

    } catch (error) {
      console.error('Azul Payment Error:', error);
      throw error;
    }
  },

  submitHiddenForm(actionUrl: string, fields: Record<string, string>) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = actionUrl;
    form.style.display = 'none';

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }
};
