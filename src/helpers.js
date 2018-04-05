module.exports = {
  stringSort: list =>
    list.sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })),
  scoreSort: applicants =>
    applicants.sort(({ candidacyScore: a}, { candidacyScore: b }) => {
      if (!a) {
        return 1
      }
      if (!b) {
        return -1
      }
      return  a > b ? -1 : 1
    })
}
