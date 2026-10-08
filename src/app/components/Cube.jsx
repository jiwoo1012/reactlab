'use client'

import {useEffect, useRef} from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import './Cube.module.scss'

const Cube = () => {
  const boxRef=useRef(null)

  useEffect(()=>{
    if(!boxRef.current){
      return
    }

    const scene=new THREE.Scene() // 3D 공간 만들기 명령

    const camera=new THREE.PerspectiveCamera( // 카메라 보는 시점 만들기
      75, // 내 시각을 얼마나 넓게 볼 건가? , 각도?
      420/320, // 화면의 가로 비율, 세로 비율
      0.1, // 여기보다 가까운 곳은 안 보이게
      1000 // 여기보다 먼 곳도 안 보이게
    )

    camera.position.z=4


    // 브라우저 화면에게 그려주는 역할
    const renderer=new THREE.WebGLRenderer({
      antialias: true, // 물체의 테두리를 부드럽게
      alpha: true // 배경을 투명하게 사용 가능
    })

    renderer.setSize(420,320) // 렌더러가 그릴 화면 크기

    const container=boxRef.current

    container.appendChild(
      renderer.domElement // 렌더러는 <canvas>라는 화면을 만들어서 사용한다.
    )


    const geometry=new THREE.BoxGeometry( // 박스 형태의 3D 모양을 만드는 것
      2.3, // 가로
      2.3, // 세로
      2.3 // 깊이
    )


    // new THREE.TorusGeometry (도넛 3차원
    // 1, // 도넛 전체 반지름
    // 0.4, // 도넛 관의 굵기
    // 16, // 관을 얼마나 부드럽게 할 건지
    // 100 // 도넛 둘레를 얼마나 부드럽게 할 건지)


    const material=new THREE.MeshNormalMaterial()
    // 면의 방향에 따라 자동으로 여러 색을 보여주는 재질


    /*
    반드시 라이트가 있어야 반짝이는 느낌을 가질 수 있다.

    material=new THREE.MeshphongMaterial ({//반짝이는 느낌을 보여주는 재질
      color: 'red',
      shininess:100,
    })

    라이트 추가 설정이 있어야
    const light = new THREE.DirectionalLight('white',3) (무슨 색, 빛의 강도)
    light.position.set(3,3,5)
    scene.add(light) :: scene.add(cube) 아래에 있어야 한다.
    */


    const cube=new THREE.Mesh(
      geometry,
      material
    )

    scene.add(cube)


    const rotationTween=gsap.to(cube.rotation,{
      x:Math.PI * 2,
      y:Math.PI * 2,
      duration:5,
      repeat:-1,
      ease:'none'
    })


    // requestAnimationFrame 번호를
    // animate 밖에서도 사용할 수 있게 만들어둠
    let aniId=0


    const animate=()=>{
      aniId=requestAnimationFrame(animate)

      renderer.render(scene,camera)
    }


    animate()


    return()=>{ // useEffect를 끝맺어줘야 함. 그래야 낭비가 되지 않음
      cancelAnimationFrame(aniId)

      rotationTween.kill()

      geometry.dispose()
      material.dispose()
      renderer.dispose()

      renderer.domElement.remove()
    }


  },[])


  return (
    <div ref={boxRef}/>
  )
}

export default Cube