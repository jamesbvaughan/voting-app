module.exports = {
  stringSort: list =>
    list.sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })),
}
