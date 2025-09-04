export const handler = async (event: any) => {
    const values = (event.rows || []).map((r: any) => [r.Name, r.Status, r.DueDate]);
    return { ...event, values, meta: { ...event.meta, transformed: values.length } };
  };
  