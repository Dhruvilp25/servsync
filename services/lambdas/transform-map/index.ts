export const handler = async (event: any) => {
  // `columns` is the ordered list of Notion property names (from pull-notion).
  const columns: string[] = event.columns || [];
  const values = (event.rows || []).map((r: Record<string, string>) =>
    columns.map((c) => r[c] ?? '')
  );
  // Header row of property names so the sheet is self-describing.
  return {
    ...event,
    header: columns,
    values,
    meta: { ...event.meta, transformed: values.length },
  };
};
