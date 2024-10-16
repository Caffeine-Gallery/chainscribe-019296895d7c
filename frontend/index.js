import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { idlFactory as backend_idl, canisterId as backend_id } from 'declarations/backend';

let quill;
let backend;
let authClient;

async function init() {
  authClient = await AuthClient.create();

  if (await authClient.isAuthenticated()) {
    handleAuthenticated(authClient);
  } else {
    document.getElementById('loginButton').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'none';
    document.getElementById('loginButton').onclick = async () => {
      document.getElementById('loginButton').innerText = 'Logging in...';
      await authClient.login({
        identityProvider: 'https://identity.ic0.app/#authorize',
        onSuccess: () => {
          handleAuthenticated(authClient);
        }
      });
    };
  }
}

async function handleAuthenticated(authClient) {
  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ identity });

  backend = Actor.createActor(backend_idl, {
    agent,
    canisterId: backend_id,
  });

  document.getElementById('loginButton').style.display = 'none';
  document.getElementById('logoutButton').style.display = 'block';
  document.getElementById('newPostButton').style.display = 'block';

  document.getElementById('logoutButton').onclick = async () => {
    await authClient.logout();
    window.location.reload();
  };

  document.getElementById('newPostButton').onclick = () => {
    document.getElementById('newPost').style.display = 'block';
    quill = new Quill('#editor', { theme: 'snow' });
  };

  document.getElementById('submitPostButton').onclick = async () => {
    const title = document.getElementById('titleInput').value;
    const body = quill.root.innerHTML;
    const button = document.getElementById('submitPostButton');

    button.disabled = true;
    button.innerText = 'Submitting...';

    try {
      await backend.addPost(title, body);
      document.getElementById('newPost').style.display = 'none';
      loadPosts();
    } catch (error) {
      console.error(error);
    } finally {
      button.disabled = false;
      button.innerText = 'Submit';
    }
  };

  loadPosts();
}

async function loadPosts() {
  const postsDiv = document.getElementById('posts');
  postsDiv.innerHTML = '<p>Loading posts...</p>';

  try {
    const posts = await backend.getPosts();
    postsDiv.innerHTML = '';

    posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'post';

      const title = document.createElement('h2');
      title.innerText = post.title;
      postDiv.appendChild(title);

      const author = document.createElement('p');
      author.className = 'author';
      author.innerText = `By ${post.author} on ${new Date(Number(post.timestamp) / 1_000_000n).toLocaleString()}`;
      postDiv.appendChild(author);

      const body = document.createElement('div');
      body.innerHTML = post.body;
      postDiv.appendChild(body);

      postsDiv.appendChild(postDiv);
    });
  } catch (error) {
    console.error(error);
    postsDiv.innerHTML = '<p>Error loading posts.</p>';
  }
}

init();
