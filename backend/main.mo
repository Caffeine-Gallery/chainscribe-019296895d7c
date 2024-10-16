import Int "mo:base/Int";
import Text "mo:base/Text";

import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Time "mo:base/Time";

actor {

  // Data structure for a blog post
  stable var posts : [Post] = [];

  type Post = {
    id: Nat;
    title: Text;
    body: Text;
    author: Text;
    timestamp: Int;
  };

  public shared({ caller }) func addPost(title : Text, body : Text) : async () {
    // Create a new post
    let currentTime = Time.now();
    let newPost : Post = {
      id = posts.size() + 1;
      title = title;
      body = body;
      author = Principal.toText(caller);
      timestamp = currentTime;
    };
    posts := Array.append<Post>(posts, [newPost]);
  };

  public query func getPosts() : async [Post] {
    // Return posts sorted by most recent
    return Array.sort<Post>(posts, func(a, b) {
      if (a.timestamp > b.timestamp) {
        return #less;
      } else if (a.timestamp < b.timestamp) {
        return #greater;
      } else {
        return #equal;
      }
    });
  };
}
