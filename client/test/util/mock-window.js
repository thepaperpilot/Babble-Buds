global.window = {
    // For some reason parts of the code need to use window.require
    //  but in tests window is undefined, so I'll just mock it up
    // (I haven't looked into why in awhile, I'm just writing the
    //   tests under the assumption that's still true)
    require
}
