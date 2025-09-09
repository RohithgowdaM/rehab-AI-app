import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Button,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../utils/supabase';
import { useRoute } from '@react-navigation/native';

export default function PoseScreen() {
    const route = useRoute();
    const { injuryTypeId, injuryTypeName } = route.params; // passed from InjuryManagementScreen
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchExercises();
    }, []);

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

    const uploadVideo = async (exerciseId) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
            });

            if (result.type === 'success') {
                setUploading(true);
                const fileUri = result.uri;
                const fileName = `${exerciseId}_${Date.now()}.mp4`;

                const response = await fetch(fileUri);
                const fileBlob = await response.blob();

                const { data, error } = await supabase.storage
                    .from('pose-videos')
                    .upload(fileName, fileBlob, { upsert: true });

                if (error) {
                    Alert.alert('Upload Failed', error.message);
                } else {
                    Alert.alert('Success', 'Video uploaded successfully!');
                }
                setUploading(false);
            }
        } catch (err) {
            setUploading(false);
            Alert.alert('Error', 'Something went wrong: ' + err.message);
        }
    };

    const renderExerciseItem = ({ item }) => (
        <View style={styles.exerciseBox}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            {item.description && <Text style={styles.exerciseDesc}>{item.description}</Text>}
            {item.demo_video_url && (
                <Text style={styles.demoText}>Demo: {item.demo_video_url}</Text>
            )}
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
