async function test() {
  const res = await fetch("https://ai-clinic-saas-eight.vercel.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Arrr! I need to book a cavity filling for June 10th, 2026 at 2:00 PM. My name is Captain Jack and my phone number is 555-1234." }]
    })
  });
  const text = await res.text();
  console.log(res.status);
  console.log(text);
}

test();
