const request = require("./request");

module.exports = class Github {
  constructor({ owner, repo, token }) {
    this.owner = owner;
    this.repo = repo;
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/vnd.github.antiope-preview+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "eslint-action"
    };
  }

  async createCheck({ name, head_sha }) {
    console.log("Create check", name, head_sha, this.owner, this.repo);
    const { data } = await request(
      `https://api.github.com/repos/${this.owner}/${this.repo}/check-runs`,
      {
        method: "POST",
        headers: this.headers,
        body: {
          name,
          head_sha,
          status: "in_progress",
          started_at: new Date()
        }
      }
    );

    console.log("Create check response", data);

    return data.id;
  }

  async updateCheck({ name, head_sha }, id, conclusion, output) {
    console.log("Update check", name, head_sha, id, conclusion, output);
    const { data } = await request(
      `https://api.github.com/repos/${this.owner}/${this.repo}/check-runs/${id}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: {
          name,
          head_sha,
          status: "completed",
          completed_at: new Date(),
          conclusion,
          output
        }
      }
    );

    console.log("Update check response", data);
    return data;
  }

  async getDiff(number) {
    const { data } = await request(
      `https://api.github.com/repos/${this.owner}/${this.repo}/pulls/${number}`,
      {
        method: "GET",
        headers: {
          ...this.headers,
          Accept: "application/vnd.github.diff"
        }
      }
    );
    return data;
  }
};
