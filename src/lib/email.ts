export async function sendNotificationEmail(ticketData: {
  customer_name: string;
  email: string;
  product_type: string;
  description: string;
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'SAV Notification <noreply@your-domain.com>',
      to: 'chervince@gmail.com',
      subject: `Nouveau ticket SAV - ${ticketData.customer_name}`,
      html: `
        <h2>Nouveau ticket SAV</h2>
        <p><strong>Client:</strong> ${ticketData.customer_name}</p>
        <p><strong>Email:</strong> ${ticketData.email}</p>
        <p><strong>Produit:</strong> ${ticketData.product_type}</p>
        <p><strong>Description:</strong> ${ticketData.description}</p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'envoi de l\'email');
  }
}