import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../utils/supabase';
import { useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

const API_BASE = "https://97426570cde7.ngrok-free.app"; // Python FastAPI server

export default function PoseScreen() {
    const route = useRoute();
    const { injuryTypeId, injuryTypeName, injuryId, userId } = route.params;
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [videoList, setVideoList] = useState([]);
    const [processingMessage, setProcessingMessage] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedVideoResults, setSelectedVideoResults] = useState(null);

    useEffect(() => {
        fetchExercises();
        fetchVideosForInjury();
    }, []);

    // Fetch exercises
    const fetchExercises = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('exercises_table')
            .select('*')
            .eq('injury_type_id', injuryTypeId);

        if (error) {
            Alert.alert('Error', 'Failed to fetch exercises: ' + error.message);
        } else {
            setExercises(data);
        }
        setLoading(false);
    };

    // Fetch all videos for this injury
    const fetchVideosForInjury = async () => {
        const { data, error } = await supabase
            .from('uploaded_videos')
            .select('*')
            .eq('user_id', userId)
            .eq('injury_id', injuryId)
            .order('created_at', { ascending: false });

        if (!error) {
            setVideoList(data || []);

            // Trigger processing for any videos still in 'uploaded' state
            (data || []).forEach(video => {
                if (video.status === 'uploaded') {
                    triggerVideoProcessing(video);
                }
            });
        }
    };

    // Upload video via FastAPI server
    const uploadVideo = async (exerciseId) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: false });
            console.log(result)
            if (!result.canceled) {
                setUploading(true);
                const file = result.assets[0];
                const fileUri = file.uri;
                const fileName = file.name;
                const mimeType = file.mimeType;
                // Read file into FormData
                const formData = new FormData();
                formData.append("user_id", userId);
                formData.append("injury_id", injuryId);
                formData.append("exercise_id", exerciseId);
                formData.append("file", {
                    uri: fileUri,
                    name: fileName,
                    type: mimeType,
                });

                const res = await fetch(`${API_BASE}/upload_video`, {
                    method: "POST",
                    body: formData,
                });


                const data = await res.json();

                if (data.status === "success") {
                    Alert.alert("Success", "Video uploaded successfully!");
                    // Fetch latest videos again
                    fetchVideosForInjury();
                } else {
                    Alert.alert("Error", "Upload failed: " + data.message);
                }

                setUploading(false);
            } else {
                console.log("It's failing here", result)
            }
        } catch (err) {
            setUploading(false);
            Alert.alert('Error', 'Something went wrong: ' + err.message);
        }
    };

    // Trigger processing
    const triggerVideoProcessing = async (video) => {
        setProcessingMessage(`Processing video: ${video.id}`);

        await fetch(`${API_BASE}/process_video/${video.id}`, {
            method: 'POST',
            body: new URLSearchParams({
                user_id: userId,
                injury_id: injuryId,
                exercise_type: video.exercise_id,
            }),
        });

        pollVideoStatus(video.id);
    };

    // Poll video status
    const pollVideoStatus = (videoId) => {
        const interval = setInterval(async () => {
            const res = await fetch(`${API_BASE}/video_status/${videoId}`);
            const data = await res.json();

            setVideoList(prev =>
                prev.map(v => v.id === videoId ? { ...v, status: data.status } : v)
            );

            if (data.status === 'done' || data.status === 'error') {
                clearInterval(interval);
                setProcessingMessage('');
                if (data.status === 'done') {
                    setSelectedVideoResults(data.result);
                }
            }
        }, 3000);
    };

    const fetchVideoResults = async (videoId) => {
        const res = await fetch(`${API_BASE}/video_status/${videoId}`);
        const data = await res.json();
        if (data.status === 'done') setSelectedVideoResults(data.result);
    };

    const renderExerciseItem = ({ item }) => (
        <View style={styles.exerciseBox}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            {item.description && <Text style={styles.exerciseDesc}>{item.description}</Text>}
            {item.demo_video_url && <Text style={styles.demoText}>Demo: {item.demo_video_url}</Text>}
            <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => uploadVideo(item.id)}
            >
                <Text style={styles.uploadButtonText}>Upload Video</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Exercises for {injuryTypeName}</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#2196f3" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={exercises}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderExerciseItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

            {uploading && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={{ color: 'white', marginTop: 10 }}>Uploading...</Text>
                </View>
            )}

            {processingMessage ? (
                <View style={{ padding: 10, backgroundColor: '#ffeb3b', marginTop: 10 }}>
                    <Text>{processingMessage}</Text>
                </View>
            ) : null}

            {/* Dropdown to select video */}
            {videoList.length > 0 && (
                <Picker
                    selectedValue={selectedVideo?.id}
                    onValueChange={(itemValue) => {
                        const video = videoList.find(v => v.id === itemValue);
                        setSelectedVideo(video);
                        fetchVideoResults(video.id);
                    }}
                    style={{ marginTop: 20 }}
                >
                    {videoList.map(video => (
                        <Picker.Item
                            key={video.id}
                            label={`${video.id} (${video.status})`}
                            value={video.id}
                        />
                    ))}
                </Picker>
            )}

            {/* Show processed results */}
            {selectedVideoResults && (
                <View style={{ padding: 15, backgroundColor: '#f0f0f0', marginTop: 10, borderRadius: 10 }}>
                    <Text>Reps: {selectedVideoResults.reps}</Text>
                    <Text>Mean Knee Angle: {selectedVideoResults.metrics.mean_knee_angle}</Text>
                    <Text>Mean Hip Angle: {selectedVideoResults.metrics.mean_hip_angle}</Text>
                    <Text>Feedback: {selectedVideoResults.feedback}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    exerciseBox: {
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
    },
    exerciseName: { fontSize: 16, fontWeight: 'bold' },
    exerciseDesc: { fontSize: 14, marginTop: 5, color: '#555' },
    demoText: { fontSize: 12, marginTop: 5, color: '#888' },
    uploadButton: {
        marginTop: 10,
        backgroundColor: '#2196f3',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    uploadButtonText: { color: '#fff', fontWeight: '600' },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
