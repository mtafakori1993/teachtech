export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Serialized from our own typed data only; "<" is escaped so it can never close the script element.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
