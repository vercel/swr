// an endpoint for getting user info
export default function user(req, res) {
  if (req.cookies['swr-test-token'] === 'swr') {
    // authorized
    res.json({
      loggedIn: true,
      name: 'Shu',
      avatar: 'https://github.com/shuding.png'
    })
    return
  }

  res.json({
    loggedIn: false
  })
}
