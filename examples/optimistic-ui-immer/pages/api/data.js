const data = []

function shouldFail() {
  return Math.random() > 0.8
}

export default (req, res) => {
  if (req.method === 'POST') {
    const body = JSON.parse(req.body)
    // sometimes it will fail, this will cause a regression on the UI
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

