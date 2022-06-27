// import * as posenet from '@tensorflow-models/posenet';
// import * as tf from '@tensorflow/tfjs';

// let video;
// const getVideo = ()=>{
//     video = document.getElementById('video');
//     navigator.mediaDevices.getUserMedia({
//       video: true
//     }).then((stream)=>{
//           video.srcObject = stream;
//       })   

//       runPoseNet();
// }

// export const runPoseNet = async ()=>{
//     const net = await posenet.load({
//       inputResolution:{
//         width:350,
//         height:250
//       },
//       scale:0.5
//     });
    
//     const right_wrist_pos = detect(net)
//     return right_wrist_pos;
// }    

// const detect = async (net)=>{
//     if(video){
      
//         const pose = await net.estimateSinglePose(video);
//         const right_wrist_pos = pose['keypoints'][10]['position'];
//         // console.log(pose)

//         return right_wrist_pos;
//     }
// }




// getVideo();
