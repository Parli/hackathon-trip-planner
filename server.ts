import http from "http";
import fs from "fs";
import path from "path";
import https from "https";
import crypto from "crypto";

// Port 8080 is commonly supported for cloud deployments
const port = 8080;

// MIME types for different file extensions
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types
const supportedMimeTypes: Record<string, string> = {
  ".aac": "audio/aac",
  ".abw": "application/x-abiword",
  ".apng": "image/apng",
  ".arc": "application/x-freearc",
  ".avif": "image/avif",
  ".avi": "video/x-msvideo",
  ".azw": "application/vnd.amazon.ebook",
  ".bin": "application/octet-stream",
  ".bmp": "image/bmp",
  ".bz": "application/x-bzip",
  ".bz2": "application/x-bzip2",
  ".cda": "application/x-cdf",
  ".csh": "application/x-csh",
  ".css": "text/css",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".eot": "application/vnd.ms-fontobject",
  ".epub": "application/epub+zip",
  ".gz": "application/gzip",
  ".gif": "image/gif",
  ".htm": "text/html",
  ".html": "text/html",
  ".ico": "image/vnd.microsoft.icon",
  ".ics": "text/calendar",
  ".jar": "application/java-archive",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".jsonld": "application/ld+json",
  ".mid": "audio/midi",
  ".midi": "audio/midi",
  ".mjs": "text/javascript",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".mpkg": "application/vnd.apple.installer+xml",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".oga": "audio/ogg",
  ".ogv": "video/ogg",
  ".ogx": "application/ogg",
  ".opus": "audio/ogg",
  ".otf": "font/otf",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".php": "application/x-httpd-php",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".rar": "application/vnd.rar",
  ".rtf": "application/rtf",
  ".sh": "application/x-sh",
  ".svg": "image/svg+xml",
  ".tar": "application/x-tar",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".ts": "video/mp2t",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".vsd": "application/vnd.visio",
  ".wav": "audio/wav",
  ".weba": "audio/webm",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xhtml": "application/xhtml+xml",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xml": "application/xml",
  ".xul": "application/vnd.mozilla.xul+xml",
  ".zip": "application/zip",
  ".3gp": "video/3gpp",
  ".3g2": "video/3gpp2",
  ".7z": "application/x-7z-compressed",
};

// Resolve storage file location
const storageFilePath =
  process.env["STORAGE_LOCATION"]?.startsWith(".") ||
  process.env["STORAGE_LOCATION"] === undefined
    ? path.join(process.cwd(), process.env["STORAGE_LOCATION"] ?? "./storage")
    : process.env["STORAGE_LOCATION"];

// Initialize in memory storage
interface StorageObject {
  created: number;
  modified: number;
  body: string;
}

let storage: Record<string, StorageObject> = {};

// Load storage from file if it exists
// This is done syncronously to prevent a race condition on startup
const loadStorage = () => {
  try {
    // Attempt to load the previous storage file if it exists
    if (fs.existsSync(storageFilePath)) {
      const data = fs.readFileSync(storageFilePath, "utf8");
      storage = JSON.parse(data);
      console.log("Storage loaded from file");
    } else {
      // Create directory if it doesn't exist so storage file can be saved there later
      if (!fs.existsSync(path.dirname(storageFilePath))) {
        fs.mkdirSync(path.dirname(storageFilePath), { recursive: true });
      }
      console.log("No storage file found, starting with empty storage");
    }
  } catch (error) {
    console.error("Error loading storage file:", error);
  }
};

let storagePromise = Promise.resolve();

// Save storage to file
const saveStorage = async () => {
  // Assign the last storage promise so the new promise can await it
  const lastStoragePromise = storagePromise;
  // Update the current storage promise immediately so future calls will await the new promise
  storagePromise = new Promise((resolve, reject) => {
    // Wait for the previous storage promise to finish before starting a new one
    lastStoragePromise.finally(() => {
      fs.writeFile(
        storageFilePath,
        JSON.stringify(storage),
        "utf8",
        (error) => {
          if (error) {
            console.error("Error saving storage file:", error);
            return reject(error);
          }
          return resolve();
        }
      );
    });
  });
};

// Load storage at startup
loadStorage();

// Environment Variable interpolation helper with trusted host whitelist
function interpolateEnvVars(value: string, host: string): string {
  // Replace env vars if they match pattern "${ENV_VAR}"
  return value.replaceAll(/\$\{(.+?)\}/g, (value, envVarName) => {
    const envVarValue = process.env[envVarName];
    // Check "ENV_VAR_ACCESS" for supported hostnames
    const envVarAccess = process.env[`${envVarName}_ACCESS`];
    const envVarAllowed =
      envVarValue !== undefined &&
      envVarAccess !== undefined &&
      (envVarAccess === "*" || envVarAccess.split(",").includes(host));
    // Check that the env var exists
    if (envVarValue === undefined) {
      console.error(`Interpolation error: "${envVarName}" value not defined`);
      return value;
    }
    // Check that the env var is allowed on the hostname
    if (envVarAllowed === false) {
      console.error(
        `Interpolation error: "${envVarName}" value not allowed for host "${host}"`
      );
      return value;
    }
    // Return the env var value for replacement of this specific match
    return envVarValue;
  });
}

const server = http.createServer(
  {
    maxHeaderSize: 16384 * 4, // Increase the default header size limit for large URLs (default is 16KB, we're setting to 64KB)
  },
  (req, res) => {
    console.log(`${req.method} ${req.url?.split("?").at(0)}`);

    // Set CORS headers for all responses
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");

    // Request routing
    if (req.method === "OPTIONS") {
      // Handle OPTIONS requests (preflight)
      res.statusCode = 204;
      res.end();
    } else if (req.url?.startsWith("/api/store/")) {
      // Handle storage requests
      storeRoute(req, res);
    } else if (req.url?.startsWith("/api/proxy/")) {
      // Handle proxy requests
      proxyRoute(req, res);
    } else {
      // Handle static file requests
      staticRoute(req, res);
    }
  }
);

/**
 * `GET /store/[hash]`
 * Gets an arbitrary `plain/text` string stored by its url safe base64 encoded MD5 `hash`.
 *
 * `POST /store/`
 * Stores an arbitrary `plain/text` body string and returns the MD5 `hash` as a url safe base64 encoded plain text string.
 */
const storeRoute: http.RequestListener = (req, res) => {
  if (req.method === "GET") {
    const hashId = req.url?.replace("/api/store/", "");
    if (hashId && storage[hashId] !== undefined) {
      // Return the data for the storage hash from the in memory storage copy
      res.writeHead(200);
      res.end(storage[hashId].body);
    } else {
      // Return not found if hash id is not found
      res.writeHead(404);
      res.end("404 Not Found");
    }
    return;
  }
  if (req.method === "POST") {
    // Retrieve the full body from the request buffer so it can be hashed
    let body = "";
    // md5 hash is used because security is not needed and a shorter hash is preferred
    const hash = crypto.createHash("md5");
    req.on("data", (chunk) => {
      const chunkString = chunk.toString();
      hash.update(chunkString);
      body += chunkString;
    });

    req.on("end", () => {
      // Disallow overly large storage requests to prevent abuse
      if (body.length > 100000) {
        res.writeHead(413, { "Content-Type": "text/plain" });
        res.end("Error content too large");
        return;
      }
      try {
        // Convert the base64 hash into a URL safe variant
        const hashId = hash
          .digest("base64")
          .replaceAll("=", "")
          .replaceAll("+", "-")
          .replaceAll("/", "_");
        // Store modified and created dates for future storage management
        const modified = Date.now();
        const created = storage[hashId]?.created ?? modified;
        storage[hashId] = {
          created,
          modified,
          body,
        };
        // Save to file after updating storage
        saveStorage();
        res.writeHead(created === modified ? 201 : 200);
        res.end(hashId);
      } catch (error) {
        console.error("Error processing storage request:", error);
        res.writeHead(500);
        res.end("Storage request error");
      }
      return;
    });
    return;
  }
};

/**
 * `[GET|POST|PUT|DELETE] /proxy/[proxy-url]`
 * Allows proxying to the `proxy-url`, forwarding any request and supports streaming.
 * Any string matching `${ENV_NAME}` in the header will replace the string with the value of that environment variable.
 * An accompanying `[ENV_VAR]_ACCESS` variable must be defined to whitelist allowed proxy hostnames to prevent leakage.
 * The hostnames must include the full host including the subdomain and can be a comma separated list of host names.
 */
const proxyRoute: http.RequestListener = (req, res) => {
  if (!req.url) {
    return;
  }
  try {
    // Set up the request to target resource
    const proxyUrl = new URL(
      decodeURIComponent(req.url.replace("/api/proxy/", ""))
    );

    // Create a filtered copy of the headers
    const filteredHeaders: Record<string, string> = Object.fromEntries(
      Object.entries(req.headers).flatMap(([key, value]) => {
        const lowerKey = key.toLowerCase();
        const valueString = Array.isArray(value) ? value.join(",") : value;
        // Skip host-specific and browser security headers
        if (
          [
            "host",
            "connection",
            "content-length",
            "user-agent",
            "origin",
            "referer",
          ].includes(lowerKey) ||
          lowerKey.startsWith("sec-") ||
          valueString === undefined
        ) {
          return [];
        }
        // Replace env vars if they match pattern "${ENV_VAR}"
        const interpolatedValue = interpolateEnvVars(valueString, proxyUrl.host);
        return [[key, interpolatedValue]];
      })
    );

    const options = {
      method: req.method,
      headers: filteredHeaders,
    };

    // Forward the request to the proxy resource and pipe it back to the original response
    const proxyReq = https.request(
      interpolateEnvVars(proxyUrl.toString(), proxyUrl.host),
      options,
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    // Handle proxy request errors
    proxyReq.on("error", (error) => {
      console.error("Proxy connection error:", error);
      res.writeHead(500);
      res.end("Proxy connection error");
    });

    // Forward the original request body to the proxy request
    req.pipe(proxyReq);
  } catch (error) {
    console.error("Proxy request error:", error);
    res.writeHead(500);
    res.end("Proxy request error");
  }
  return;
};

/**
  * `GET /[file-name]`
  * If no other route matches, files in the `public` directory will be returned.
  * This ignores the path and hash URL segments.
 */
const staticRoute: http.RequestListener = (req, res) => {
  const urlPath = req.url?.split("?")[0] ?? "/";

  // If URL is '/', serve index.html
  const filePath = urlPath === "/" ? "/index.html" : urlPath;

  // Ensure the path doesn't contain directory traversal
  const sanitizedPath = path
    .normalize(filePath ?? "")
    .replace(/^(\.\.[\/\\])+/, "");

  // Convert URL path to file system path
  const absolutePath = path.join(process.cwd(), `/public/${sanitizedPath}`);

  // Get file extension
  const extname = path.extname(absolutePath);

  // Set Content-Type based on file extension
  const contentType = supportedMimeTypes[extname] || "application/octet-stream";

  // Read file
  fs.readFile(absolutePath, (error, content) => {
    if (error === null) {
      // Success
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
      return;
    }
    if (error.code === "ENOENT") {
      // File not found
      console.error(`File not found: ${absolutePath}`);
      res.writeHead(404);
      res.end("404 Not Found");
      return;
    } else {
      // Server error
      console.error(`Server error: ${error.code}`);
      res.writeHead(500);
      res.end(`Server Error: ${error.code}`);
      return;
    }
  });
};

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log("Press Ctrl+C to stop the server");
});
