---
title: Swift and Currying Functions
date: 2014-09-04T12:26Z
tags: [swift, programming]
published: false
---

Given Swift's language-level support for curried functions, should there be a built-in for converting regular functions to curried ones?

```swift
func curry<A, B, C>(f : (A, B) -> C) (a : A) (b : B) -> C {
    return f(a, b);
}
```
