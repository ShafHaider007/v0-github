export function formatDate(dateString) {
  if (!dateString) return null

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Date formatting error:", error)
    return dateString
  }
}
