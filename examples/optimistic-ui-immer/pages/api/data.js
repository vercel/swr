const data = []

function shouldFail() {
  return Math.random() > 0.8
}

export default function api(req, res) {
  if (req.method === 'POST') {
    const body = JSON.parse(req.body)
    // sometimes it will fail, and this will cause a regression in the UI
    if (!shouldFail()) {
      data.push(body.text);
    }
    res.json(data)
    return
  }

  setTimeout(() => {
    res.json(data)
  }, 2000)
}

