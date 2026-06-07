async function test() {
  const res = await fetch("https://ai-clinic-saas-eight.vercel.app/api/vapi/inbound", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        type: "assistant-request",
        call: {
          phoneNumber: {
            number: "+13101234567"
          }
        }
      }
    })
  });
  const text = await res.text();
  console.log(res.status);
  console.log(text);
}

test();
