let todos = []
const delay = () => new Promise(res => setTimeout(() => res(), 1000))

async function getTodos() {
  await delay()
  return todos.sort((a, b) => (a.text < b.text ? -1 : 1))
}

async function addTodo(todo) {
  await delay()
  // Sometimes it will fail, this will cause a regression on the UI
  if (Math.random() < 0.2 || !todo.text)
    throw new Error('Failed to add new item!')
  todo.text = todo.text.charAt(0).toUpperCase() + todo.text.slice(1)
  todos = [...todos, todo]
  return todo
}

export default async function api(req, res) {
  try {
    if (req.method === 'POST') {
      const body = JSON.parse(req.body)
      return res.json(await addTodo(body))
    }

    return res.json(await getTodos())
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
