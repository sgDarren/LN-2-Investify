import db from "$lib/server/db";

export async function load() {
  return {
    artists: await db.getArtists(),
  }
}

export const actions = {
    delete: async ({request}) => {
        const data = await request.formData();
        // console.log(data);
        await db.deleteArtist(data.get("id"));
    }
}