"use server";

import { App, type Octokit } from "octokit";
import type { ActionResponse, Feedback } from "@/components/geistdocs/feedback";
import { emotions } from "./emotions";

const getOctokit = async (): Promise<Octokit> => {
  const repo = process.env.NEXT_PUBLIC_GEISTDOCS_REPO;
  const owner = process.env.NEXT_PUBLIC_GEISTDOCS_OWNER;
  const category = process.env.NEXT_PUBLIC_GEISTDOCS_CATEGORY;
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!(repo && owner && category && appId && privateKey)) {
    throw new Error("Missing environment variables");
  }

  const app = new App({ appId, privateKey });

  const { data } = await app.octokit.request(
    "GET /repos/{owner}/{repo}/installation",
    {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return await app.getInstallationOctokit(data.id);
};

type RepositoryInfo = {
  id: string;
  discussionCategories: {
    nodes: {
      id: string;
      name: string;
    }[];
  };
};

const getFeedbackDestination = async () => {
  const octokit = await getOctokit();
  const owner = process.env.NEXT_PUBLIC_GEISTDOCS_OWNER;
  const repo = process.env.NEXT_PUBLIC_GEISTDOCS_REPO;

  if (!(owner && repo)) {
    throw new Error("Missing environment variables");
  }

  const {
    repository,
  }: {
    repository: RepositoryInfo;
  } = await octokit.graphql(`
  query {
    repository(owner: "${owner}", name: "${repo}") {
      id
      discussionCategories(first: 25) {
        nodes { id name }
      }
    }
  }
`);

  return repository;
};

export const sendFeedback = async (
  url: string,
  feedback: Feedback
): Promise<ActionResponse> => {
  const owner = process.env.NEXT_PUBLIC_GEISTDOCS_OWNER;
  const repo = process.env.NEXT_PUBLIC_GEISTDOCS_REPO;
  const docsCategory = process.env.NEXT_PUBLIC_GEISTDOCS_CATEGORY;

  if (!(owner && repo && docsCategory)) {
    throw new Error("Missing environment variables");
  }

  const octokit = await getOctokit();
  const destination = await getFeedbackDestination();
  const category = destination.discussionCategories.nodes.find(
    ({ name }) => name === docsCategory
  );

  if (!category) {
    throw new Error(
      `Please create a "${docsCategory}" category in GitHub Discussion`
    );
  }

  const title = `Feedback for ${url}`;
  const emoji = emotions.find((e) => e.name === feedback.emotion)?.emoji;
  const body = `${emoji} ${feedback.message}\n\n> Forwarded from user feedback.`;

  let {
    search: {
      nodes: [discussion],
    },
  }: {
    search: {
      nodes: { id: string; url: string }[];
    };
  } = await octokit.graphql(`
          query {
            search(type: DISCUSSION, query: ${JSON.stringify(`${title} in:title repo:${owner}/${repo} author:@me`)}, first: 1) {
              nodes {
                ... on Discussion { id, url }
              }
            }
          }`);

  if (discussion) {
    await octokit.graphql(`
            mutation {
              addDiscussionComment(input: { body: ${JSON.stringify(body)}, discussionId: "${discussion.id}" }) {
                comment { id }
              }
            }`);
  } else {
    const result: {
      discussion: { id: string; url: string };
    } = await octokit.graphql(`
            mutation {
              createDiscussion(input: { repositoryId: "${destination.id}", categoryId: "${category.id}", body: ${JSON.stringify(body)}, title: ${JSON.stringify(title)} }) {
                discussion { id, url }
              }
            }`);

    discussion = result.discussion;
  }

  return {
    githubUrl: discussion.url,
  };
};
