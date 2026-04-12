export const addUserToServer = async ({ userInfo }) => {
  const url = "http://localhost:5000/api/signup";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInfo)
    });

    console.log("Raw response:", response);

    // Always parse JSON to see backend error
    const data = await response.json().catch(() => ({}));
    // console.log("Parsed response data:", data);
   
    if (!response.ok) {
      // 400 or validation errors
      console.error("Backend returned error:", data);
      throw new Error(data.error || data.message || JSON.stringify(data));
    }
   
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw new Error(error.message || "Fetch completely failed");
  }

};