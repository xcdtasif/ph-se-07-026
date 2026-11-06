export const logCount = (count: number, singular: string, plural: string, verb: string) => {
  console.log(`${count} ${count === 1 ? singular : plural} ${verb}`)
}
