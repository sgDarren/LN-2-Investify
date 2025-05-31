import adapter from "@sveltejs/adapter-netlify";

const config = {

  compilerOptions: {
    runes: true
  },

  kit: {
    adapter: adapter({
      edge: false,
      split: false
    })
  }
};

export default config;
