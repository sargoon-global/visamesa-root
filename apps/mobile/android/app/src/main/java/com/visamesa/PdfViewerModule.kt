package com.visamesa

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import java.io.File

class PdfViewerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener, ActivityEventListener {

  private var openPdfPromise: Promise? = null
  private var openedExternalPdf = false
  private var hostPausedAfterPdfOpen = false

  init {
    reactContext.addLifecycleEventListener(this)
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "PdfViewer"

  @ReactMethod
  fun savePdfBase64(base64: String, fileName: String, promise: Promise) {
    try {
      val bytes = Base64.decode(base64, Base64.DEFAULT)
      val file = File(reactContext.filesDir, fileName)
      file.writeBytes(bytes)

      val result =
        WritableNativeMap().apply {
          putString("fileName", fileName)
          putString("path", file.absolutePath)
          putString("uri", "file://${file.absolutePath}")
        }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("PDF_SAVE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun openPdf(pathOrUri: String, promise: Promise) {
    try {
      val path = pathOrUri.removePrefix("file://")
      val file = File(path)

      if (!file.exists()) {
        promise.reject("PDF_NOT_FOUND", "PDF file does not exist: $path")
        return
      }

      val activity = reactContext.currentActivity
      if (activity == null) {
        promise.reject("PDF_OPEN_FAILED", "No active activity is available to open the PDF")
        return
      }

      clearOpenPdfState()

      val authority = "${reactContext.packageName}.fileprovider"
      val uri = FileProvider.getUriForFile(reactContext, authority, file)
      val viewIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/pdf")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        clipData = ClipData.newUri(reactContext.contentResolver, file.name, uri)
      }
      val chooser = Intent.createChooser(viewIntent, "Open PDF").apply {
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }

      openPdfPromise = promise
      activity.startActivityForResult(chooser, OPEN_PDF_REQUEST_CODE)
    } catch (error: ActivityNotFoundException) {
      clearOpenPdfState()
      promise.reject("NO_PDF_VIEWER", "No app is available to open PDF files", error)
    } catch (error: Exception) {
      clearOpenPdfState()
      promise.reject("PDF_OPEN_FAILED", error.message, error)
    }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) {
    if (requestCode != OPEN_PDF_REQUEST_CODE) {
      return
    }

    if (resultCode == Activity.RESULT_CANCELED) {
      resolveOpenPdf()
      return
    }

    openedExternalPdf = true
  }

  override fun onHostResume() {
    if (openedExternalPdf && hostPausedAfterPdfOpen) {
      resolveOpenPdf()
    }
  }

  override fun onHostPause() {
    if (openedExternalPdf) {
      hostPausedAfterPdfOpen = true
    }
  }

  override fun onHostDestroy() {
    rejectOpenPdf("PDF_OPEN_CANCELLED", "Activity destroyed while opening PDF")
  }

  override fun onNewIntent(intent: Intent) {}

  private fun resolveOpenPdf() {
    openPdfPromise?.resolve(null)
    clearOpenPdfState()
  }

  private fun rejectOpenPdf(code: String, message: String) {
    openPdfPromise?.reject(code, message, null)
    clearOpenPdfState()
  }

  private fun clearOpenPdfState() {
    openPdfPromise = null
    openedExternalPdf = false
    hostPausedAfterPdfOpen = false
  }

  companion object {
    private const val OPEN_PDF_REQUEST_CODE = 9101
  }
}
