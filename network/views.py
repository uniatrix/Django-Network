from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from .models import *


def index(request):
    if request.method == "POST":
        if request.user.is_authenticated:
            content = request.POST.get('content')
            if content:
                Post.objects.create(user=request.user, content=content)
                return redirect('index')
        else:
            return redirect('login')

    # Paginate posts
    post_list = Post.objects.order_by('-timestamp')
    paginator = Paginator(post_list, 10)  # Show 10 posts per page

    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)

    for post in posts:
        post.has_liked = post.likes.filter(user=request.user).exists() if request.user.is_authenticated else False

    return render(request, "network/index.html", {
        "posts": posts
    })


def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def all_posts(request):
    posts_list = Post.objects.all().order_by('-timestamp')

    paginator = Paginator(posts_list, 10)
    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)

    if request.user.is_authenticated:
        for post in posts:
            post.has_liked = post.likes.filter(user=request.user).exists()

    return render(request, "network/all_posts.html", {
        "posts": posts
    })

@login_required
def like_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    liked = Like.objects.filter(user=request.user, post=post).exists()

    if liked:
        Like.objects.filter(user=request.user, post=post).delete()
    else:
        Like.objects.create(user=request.user, post=post)

    return JsonResponse({
        "likes_count": post.likes.count(),
        "liked": not liked
    })

@login_required
def profile(request, username):
    profile_user = get_object_or_404(User, username=username)
    
    # Get the posts for the profile user and paginate them
    post_list = Post.objects.filter(user=profile_user).order_by('-timestamp')
    paginator = Paginator(post_list, 10)  # Show 10 posts per page

    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)
    
    for post in posts:
        post.has_liked = post.likes.filter(user=request.user).exists()
    
    followers_count = profile_user.followers.count()
    following_count = profile_user.following.count()

    # Check if the current user is following the profile user
    is_following = profile_user.followers.filter(id=request.user.id).exists()

    # Handle follow/unfollow actions
    if request.method == "POST":
        if is_following:
            profile_user.followers.remove(request.user)
        else:
            profile_user.followers.add(request.user)
        return redirect('profile', username=username)

    return render(request, "network/profile.html", {
        "profile_user": profile_user,
        "posts": posts,
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following
    })

@login_required
def following(request):
    following_users = request.user.following.all()
    post_list = Post.objects.filter(user__in=following_users).order_by('-timestamp')

    paginator = Paginator(post_list, 10)

    page_number = request.GET.get('page')
    posts = paginator.get_page(page_number)

    for post in posts:
        post.has_liked = post.likes.filter(user=request.user).exists()

    return render(request, "network/following.html", {
        "posts": posts
    })

@login_required
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    if request.user != post.user:
        return JsonResponse({"error": "You cannot edit this post."}, status=403)

    if request.method == "POST":
        content = request.POST.get('content')
        if content:
            post.content = content
            post.save()
            return JsonResponse({"message": "Post updated successfully.", "content": post.content}, status=200)
        else:
            return JsonResponse({"error": "Content cannot be empty."}, status=400)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)