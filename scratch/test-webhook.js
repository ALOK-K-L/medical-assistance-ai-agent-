const url = 'https://carriable-superseriously-jovanni.ngrok-free.dev/api/tools/query-db';

const payload = {
  message: {
    type: 'tool-calls',
    toolCalls: [
      {
        id: 'call_123',
        function: {
          name: 'send_whatsapp_message',
          arguments: JSON.stringify({
            patientName: 'Test',
            doctorName: 'Dr. Test',
            appointmentDate: 'Tomorrow'
          })
        }
      }
    ]
  }
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(text => {
  console.log("RESPONSE:", text);
})
.catch(err => {
  console.error("ERROR:", err);
});
