import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { Camera } from "expo-camera";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as posedetection from "@tensorflow-models/pose-detection";

export default function PoseScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isTfReady, setIsTfReady] = useState(false);
  const [pose, setPose] = useState(null);
  const cameraRef = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    // Load camera + TensorFlow + model
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

      await tf.ready(); // TensorFlow.js ready
      setIsTfReady(true);

      detectorRef.current = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        { modelType: "SinglePose.Lightning" }
      );
    })();
  }, []);

  const handleCameraStream = async (images) => {
    if (!detectorRef.current) return;
    const nextImageTensor = images.next().value;
    if (!nextImageTensor) return;

    try {
      const poses = await detectorRef.current.estimatePoses(nextImageTensor);
      if (poses.length > 0) {
        setPose(poses[0]); // Store first detected pose
      }
    } catch (err) {
      console.log("Pose detection error:", err);
    }
  };

  if (hasPermission === null) {
    return <View><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isTfReady ? (
        <>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.front}
            onReady={() => console.log("Camera Ready")}
          />
          <View style={styles.overlay}>
            {pose ? (
              <Text style={styles.poseText}>
                Detected keypoints: {pose.keypoints.length}
              </Text>
            ) : (
              <Text style={styles.poseText}>No pose detected yet...</Text>
            )}
          </View>
        </>
      ) : (
        <ActivityIndicator size="large" color="#00ff00" />
      )}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    width: width,
    height: height,
  },
  overlay: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  poseText: {
    color: "#fff",
    fontSize: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 10,
  },
});
